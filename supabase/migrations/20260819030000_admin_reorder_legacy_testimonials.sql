BEGIN;

-- Atomically swaps a legacy testimonial's display_order with its neighbor so admins
-- can reorder homepage testimonials without tripping the display_order UNIQUE
-- constraint (a naive two-statement client-side swap would collide mid-transaction).
CREATE OR REPLACE FUNCTION public.admin_move_legacy_testimonial(p_id BIGINT, p_direction TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_current_order SMALLINT;
  v_neighbor_id BIGINT;
  v_neighbor_order SMALLINT;
  v_temp_order SMALLINT;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can reorder legacy testimonials';
  END IF;

  IF p_direction NOT IN ('up', 'down') THEN
    RAISE EXCEPTION 'Invalid direction: %', p_direction;
  END IF;

  SELECT display_order INTO v_current_order
  FROM public.legacy_testimonials WHERE id = p_id;

  IF v_current_order IS NULL THEN
    RAISE EXCEPTION 'Legacy testimonial % not found', p_id;
  END IF;

  IF p_direction = 'up' THEN
    SELECT id, display_order INTO v_neighbor_id, v_neighbor_order
    FROM public.legacy_testimonials
    WHERE display_order < v_current_order
    ORDER BY display_order DESC LIMIT 1;
  ELSE
    SELECT id, display_order INTO v_neighbor_id, v_neighbor_order
    FROM public.legacy_testimonials
    WHERE display_order > v_current_order
    ORDER BY display_order ASC LIMIT 1;
  END IF;

  IF v_neighbor_id IS NULL THEN
    RETURN;
  END IF;

  SELECT max(display_order) + 1 INTO v_temp_order FROM public.legacy_testimonials;

  UPDATE public.legacy_testimonials SET display_order = v_temp_order WHERE id = p_id;
  UPDATE public.legacy_testimonials SET display_order = v_current_order WHERE id = v_neighbor_id;
  UPDATE public.legacy_testimonials SET display_order = v_neighbor_order WHERE id = p_id;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_move_legacy_testimonial(BIGINT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_move_legacy_testimonial(BIGINT, TEXT) TO authenticated;

COMMIT;
