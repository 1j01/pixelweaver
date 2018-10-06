
// proxy to/from worker

var renderFrameData = null;

function renderFrame() {
  var dst = Module.canvasData.data;
  if (dst.set) {
    dst.set(renderFrameData);
  } else {
    for (var i = 0; i < renderFrameData.length; i++) {
      dst[i] = renderFrameData[i];
    }
  }
  Module.ctx.putImageData(Module.canvasData, 0, 0);
  renderFrameData = null;
}

// Frame throttling

var frameId = 0;

// Worker

var worker = new Worker('src/worker.js');

WebGLClient.prefetch();

setTimeout(function() {
  worker.postMessage({ target: 'worker-init', width: Module.canvas.width, height: Module.canvas.height, preMain: true });
}, 0); // delay til next frame, to make sure html is ready

var workerResponded = false;

worker.onmessage = function worker_onmessage(event) {
  // dump('\nclient got ' + JSON.stringify(event.data).substr(0, 150) + '\n');
  if (!workerResponded) {
    workerResponded = true;
    if (Module.setStatus) Module.setStatus('');
  }

  var data = event.data;
  switch (data.target) {
    case 'stdout': {
      Module.print(data.content);
      break;
    }
    case 'stderr': {
      Module.printErr(data.content);
      break;
    }
    case 'window': {
      Module.printErr("(Disabled: not allowing worker to execute window."+data.method+" via proxy)");
      // window[data.method]();
      break;
    }
    case 'canvas': {
      switch (data.op) {
        case 'getContext': {
          Module.ctx = Module.canvas.getContext(data.type, data.attributes);
          if (data.type !== '2d') {
            // possible GL_DEBUG entry point: Module.ctx = wrapDebugGL(Module.ctx);
            Module.glClient = new WebGLClient();
          }
          break;
        }
        case 'resize': {
          Module.canvas.width = data.width;
          Module.canvas.height = data.height;
          if (Module.ctx && Module.ctx.getImageData) Module.canvasData = Module.ctx.getImageData(0, 0, data.width, data.height);
          worker.postMessage({ target: 'canvas', boundingClientRect: cloneObject(Module.canvas.getBoundingClientRect()) });
          break;
        }
        case 'render': {
          if (renderFrameData) {
            // previous image was not rendered yet, just update image
            renderFrameData = data.image.data;
          } else {
            // previous image was rendered so update image and request another frame
            renderFrameData = data.image.data;
            requestAnimationFrame(renderFrame);
          }
          break;
        }
        default: throw new Error('Unhandled canvas-related message from worker to client: ' + JSON.stringify(message.data));
      }
      break;
    }
    case 'gl': {
      Module.glClient.onmessage(data);
      break;
    }
    case 'tick': {
      frameId = data.id;
      worker.postMessage({ target: 'tock', id: frameId });
      break;
    }
    case 'Image': {
      Module.printErr("(Image support disabled)");
      // assert(data.method === 'src');
      // var img = new Image();
      // img.onload = function() {
      //   assert(img.complete);
      //   var canvas = document.createElement('canvas');
      //   canvas.width = img.width;
      //   canvas.height = img.height;
      //   var ctx = canvas.getContext('2d');
      //   ctx.drawImage(img, 0, 0);
      //   var imageData = ctx.getImageData(0, 0, img.width, img.height);
      //   worker.postMessage({ target: 'Image', method: 'onload', id: data.id, width: img.width, height: img.height, data: imageData.data, preMain: true });
      // };
      // img.onerror = function() {
      //   worker.postMessage({ target: 'Image', method: 'onerror', id: data.id, preMain: true });
      // };
      // img.src = data.src;
      break;
    }
    default: throw new Error('Unhandled message from worker: ' + JSON.stringify(message.data));
  }
};

function cloneObject(event) {
  var ret = {};
  for (var x in event) {
    if (x == x.toUpperCase()) continue;
    var prop = event[x];
    if (typeof prop === 'number' || typeof prop === 'string') ret[x] = prop;
  }
  return ret;
};

