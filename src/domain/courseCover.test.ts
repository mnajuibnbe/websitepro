import test from 'node:test';
import assert from 'node:assert/strict';
import { coverCrop, formatFileSize } from '../lib/courseCover';

test('calculates a centered 16:9 crop without stretching',()=>{
  const wide=coverCrop(2000,1000,1600,900);assert.ok(Math.abs(wide.x-111.111)<.01);assert.ok(Math.abs(wide.width-1777.778)<.01);assert.equal(wide.y,0);assert.equal(wide.height,1000);
  assert.deepEqual(coverCrop(1000,1000,1600,900),{x:0,y:218.75,width:1000,height:562.5});
});

test('formats original and optimized image sizes',()=>{assert.equal(formatFileSize(512),'512 B');assert.equal(formatFileSize(2048),'2 KB');assert.equal(formatFileSize(1572864),'1.5 MB');});
