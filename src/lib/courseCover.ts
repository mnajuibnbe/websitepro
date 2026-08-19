export const COURSE_COVER_WIDTH = 1600;
export const COURSE_COVER_HEIGHT = 900;
export const COURSE_COVER_MAX_BYTES = 700 * 1024;
export const COURSE_COVER_MIN_WIDTH = 800;
export const COURSE_COVER_MIN_HEIGHT = 450;

export interface ProcessedCoverImage { blob: Blob; width: number; height: number; originalBytes: number; processedBytes: number; }
/** @deprecated use ProcessedCoverImage -- kept as an alias so existing call sites don't churn. */
export type ProcessedCourseCover = ProcessedCoverImage;

export function coverCrop(sourceWidth:number,sourceHeight:number,targetWidth:number,targetHeight:number){
  const sourceRatio=sourceWidth/sourceHeight;const targetRatio=targetWidth/targetHeight;
  if(sourceRatio>targetRatio){const width=sourceHeight*targetRatio;return{x:(sourceWidth-width)/2,y:0,width,height:sourceHeight};}
  const height=sourceWidth/targetRatio;return{x:0,y:(sourceHeight-height)/2,width:sourceWidth,height};
}

export function canvasBlob(canvas:HTMLCanvasElement,quality:number):Promise<Blob>{return new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('This browser could not optimize the image.')),'image/webp',quality));}

/** Shared by course covers and blog covers -- same crop/downscale/re-encode budget, different target dimensions. */
export interface CoverImageBudget { width: number; height: number; maxBytes: number; minWidth: number; minHeight: number; }

export async function processCoverImage(file:File,budget:CoverImageBudget):Promise<ProcessedCoverImage>{
  const bitmap=await createImageBitmap(file);
  try{
    if(bitmap.width<budget.minWidth||bitmap.height<budget.minHeight)throw new Error(`Use an image at least ${budget.minWidth} × ${budget.minHeight} pixels.`);
    if(bitmap.width*bitmap.height>40_000_000)throw new Error('The image dimensions are too large to process safely.');
    let width=Math.min(budget.width,bitmap.width);let height=Math.round(width*budget.height/budget.width);if(height>bitmap.height){height=Math.min(budget.height,bitmap.height);width=Math.round(height*budget.width/budget.height);}
    const crop=coverCrop(bitmap.width,bitmap.height,width,height);let blob:Blob|null=null;
    for(const scale of [1,.9,.8,.7]){const canvas=document.createElement('canvas');canvas.width=Math.round(width*scale);canvas.height=Math.round(height*scale);const context=canvas.getContext('2d',{alpha:false});if(!context)throw new Error('Image optimization is unavailable.');context.imageSmoothingEnabled=true;context.imageSmoothingQuality='high';context.drawImage(bitmap,crop.x,crop.y,crop.width,crop.height,0,0,canvas.width,canvas.height);for(const quality of [.86,.8,.74,.68]){blob=await canvasBlob(canvas,quality);if(blob.type!=='image/webp')throw new Error('This browser cannot create optimized WebP images.');if(blob.size<=budget.maxBytes)return{blob,width:canvas.width,height:canvas.height,originalBytes:file.size,processedBytes:blob.size};}}
    if(!blob)throw new Error('The image could not be optimized.');
    throw new Error('The optimized image is still too large. Choose a less complex image.');
  }finally{bitmap.close();}
}

export function processCourseCover(file:File):Promise<ProcessedCoverImage>{
  return processCoverImage(file,{width:COURSE_COVER_WIDTH,height:COURSE_COVER_HEIGHT,maxBytes:COURSE_COVER_MAX_BYTES,minWidth:COURSE_COVER_MIN_WIDTH,minHeight:COURSE_COVER_MIN_HEIGHT});
}

export function formatFileSize(bytes:number){if(bytes<1024)return`${bytes} B`;if(bytes<1024*1024)return`${(bytes/1024).toFixed(0)} KB`;return`${(bytes/(1024*1024)).toFixed(1)} MB`;}
