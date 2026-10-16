import domtoimage from 'dom-to-image';
import { isEmpty } from 'lodash-es';

export function GetDpi() {
    return 96
}

export const DownLoadImg = async (mapUrl, excelImg, canvasWidth, canvasHeight, width, height, padding, zoom, mapLayout) => {
  const layout = mapLayout || 1;
  const mapTitleWrap = document.getElementById('mapTitleWrap')
  let mapTitleRes;
  if (mapTitleWrap) {
    mapTitleRes = await domtoimage.toPng(mapTitleWrap)
  }
  const compassWrap = document.getElementById('compassImgWrap')
  let compassRes;
  if (compassWrap) {
    compassRes = await domtoimage.toPng(compassWrap)
  }
  const dateWrap = document.getElementById('dateWrap')
  let dateRes;
  if (dateWrap) {
    dateRes = await domtoimage.toPng(dateWrap)
  }
  const scaleWrap = document.getElementById('scaleWrap')
  let scaleRes;
  if (scaleWrap) {
    scaleRes = await domtoimage.toPng(scaleWrap)
  }
  const legendWrap = document.getElementById('printLegend')
  let legendRes;
  if (legendWrap) {
    legendRes = await domtoimage.toPng(legendWrap)
  }
  const canvasNodeBase64 = await OmDrawAndShareImage(mapUrl, excelImg, mapTitleRes, compassRes, dateRes, scaleRes, legendRes, canvasWidth, canvasHeight, width, height, padding, zoom, layout)
  return canvasNodeBase64;
}


export const OmDrawAndShareImage = async (mapViewSrc, excelImg, mapTitleSrc, mapPassSrc, dateSrc, scaleSrc, legendSrc, canvasWidth, canvasHeight, width, height, padding, zoom, mapLayout) => {
  const canvas = document.createElement("canvas");
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const context = canvas.getContext("2d");
  context.rect(-1, -1, canvas.width + 2, canvas.height + 2);
  const mapContent = canvas.getContext("2d");
  const left = 2.54 * 28.346;
  const top = 3.18 * 28.346;
  const mapImagePadding = padding;
  const mapImageTop = padding;
  mapContent.rect(mapImagePadding, mapImageTop + 20, canvas.width - 2 * mapImagePadding, canvas.height - 2 * mapImageTop - 30);
  mapContent.fillStyle = 'white'
  mapContent.fill();
  mapContent.lineWidth = 1;
  mapContent.strokeStyle = "black";
  mapContent.stroke();
  const myImage = new Image();
  myImage.src = mapViewSrc;
  myImage.crossOrigin = 'Anonymous';
  let _width = width;
  let _height = height;
  if (_width > canvasWidth) {
    _width = canvasWidth;
    _height = canvasWidth > canvasHeight ? _width * (canvasWidth / canvasHeight) : _width * (canvasHeight / canvasWidth);
  }

  if (_height > canvasHeight) {
    _height = canvasHeight;
    _width = canvasWidth > canvasHeight ? _height * (canvasWidth / canvasHeight) : _height * (canvasHeight / canvasWidth);
  }
  const imgWidth = _width - (2 * mapImagePadding) - 2
  const imgHeight = _height - (2 * mapImageTop + 30) - 2;
  const x = (canvas.width - imgWidth) / 2;
  const y = mapImageTop + 21;
  await myImage.onload
  mapContent.drawImage(myImage, x, y, imgWidth, imgHeight);

  const myImage2 = new Image();
  myImage2.src = mapTitleSrc;
  myImage2.crossOrigin = 'Anonymous';
  await myImage2.onload
  mapContent.drawImage(myImage2, (canvas.width - myImage2.width) / 2, canvas.height - mapImageTop - imgHeight - myImage2.height - 10);

  const myImage3 = new Image();
  myImage3.src = mapPassSrc;
  myImage3.crossOrigin = 'Anonymous';
  await myImage3.onload
  const compassPadding = 16
  mapContent.drawImage(myImage3, canvas.width - mapImagePadding - myImage3.width - compassPadding, mapImageTop + compassPadding + 20, myImage3.width, myImage3.height);

  const myImage4 = new Image();
  myImage4.src = dateSrc;
  myImage4.crossOrigin = 'Anonymous';
  await myImage4.onload
  mapContent.drawImage(myImage4, canvas.width - mapImagePadding - myImage4.width, canvas.height - mapImagePadding, myImage4.width, myImage4.height);

  if (scaleSrc) {
    const myImage5 = new Image();
    myImage5.src = scaleSrc;
    myImage5.crossOrigin = 'Anonymous';
    await myImage5.onload
    mapContent.drawImage(myImage5, +mapImagePadding, canvas.height - mapImageTop)
  }
  if (legendSrc) {
    const myImage6 = new Image();
    myImage6.src = legendSrc;
    myImage6.crossOrigin = 'Anonymous';
    await myImage6.onload
    mapContent.drawImage(myImage6, +mapImagePadding * zoom + 20 * zoom + 3 * Math.round(GetDpi()/25.4), canvas.height - mapImageTop * zoom - 3 * Math.round(GetDpi()/25.4) - 30 * zoom - myImage6.height)
  }
  if (!isEmpty(excelImg)) {
    const { url, width: w, height: h, x: X, y: Y, offsetLeft, offsetTop } = excelImg
    const myImage7 = new Image()
    myImage7.src = url;
    myImage7.crossOrigin = 'Anonymous';
    await myImage7.onload
    const xaxis = X > 0? ((offsetLeft + X)/zoom - 4.9 * Math.round(GetDpi()/25.4)) : (offsetLeft + X)/zoom
    const yaxis = Y > 0? ((offsetTop + Y)/zoom - 4.9 * Math.round(GetDpi()/25.4)) : (offsetTop + Y)/zoom - 1.7 * Math.round(GetDpi()/25.4)
    mapContent.drawImage(myImage7, xaxis, yaxis, w/zoom, h/zoom)
  }
  
  return canvas.toDataURL("image/png", 1000)
}

export function DataURLtoFile(dataUrl, filename) {
  var arr = dataUrl.split(','), mime = arr[0].match(/:(.*?);/)[1],
    bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
}
