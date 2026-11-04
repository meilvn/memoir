const fs = require('fs');
const filePath = 'src/views/GalleryView.vue';

const content = fs.readFileSync(filePath, 'utf8');

// Fix onVideoHover
const oldVideo = `function onVideoHover(mediaId, entering) {
  // 更新响应式数据
  if (entering) videoHovering.value.add(mediaId)
  else videoHovering.value.delete(mediaId)

  // 手动更新 DOM 类名，避免组件重新渲染导致 3D transform 丢失
  const video = document.querySelector(\`video[data-media-id="${mediaId}"]\`)
  if (video) {
    if (entering) {
      video.classList.add('visible')
      // 隐藏对应图片
      const img = video.parentElement?.querySelector('img')
      if (img) img.classList.add('hidden')
    } else {
      video.classList.remove('visible')
      // 显示对应图片
      const img = video.parentElement?.querySelector('img')
      if (img) img.classList.remove('hidden')
    }
  }
}`;

const newVideo = `function onVideoHover(mediaId, entering) {
  // 完全非响应式，不触发任何Vue更新
  videoHovering.set(mediaId, entering)

  // 直接操作 DOM，零延迟
  const video = document.querySelector(\`video[data-media-id="${mediaId}"]\`)
  if (video) {
    if (entering) {
      video.classList.add('visible')
      // 隐藏对应图片
      const img = video.parentElement?.querySelector('img')
      if (img) img.classList.add('hidden')
    } else {
      video.classList.remove('visible')
      // 显示对应图片
      const img = video.parentElement?.querySelector('img')
      if (img) img.classList.remove('hidden')
    }
  }
}`;

content.replace(oldVideo, newVideo);

// Fix onImageLoad
const oldImage = `function onImageLoad(mediaId) {
  // 更新响应式数据（使用 shallowRef，不会触发重新渲染）
  imageLoaded.value.add(mediaId)

  // 手动更新 DOM 类名，避免组件重新渲染导致 3D transform 丢失
  const img = document.querySelector(\`img[data-media-id="${mediaId}"]\`)
  if (img) {
    img.classList.add('loaded')
    // 手动隐藏 shimmer
    const shimmer = img.parentElement?.querySelector('.img-shimmer')
    if (shimmer) {
      shimmer.style.display = 'none'
    }
  }
}`;

const newImage = `function onImageLoad(mediaId) {
  // 完全非响应式，不触发任何Vue更新
  imageLoaded.set(mediaId, true)

  // 手动更新 DOM，不依赖 Vue 重新渲染
  const img = document.querySelector(\`img[data-media-id="${mediaId}"]\`)
  if (img) {
    img.classList.add('loaded')
    // 移除 shimmer
    const shimmer = img.parentElement?.querySelector('.img-shimmer')
    if (shimmer) {
      shimmer.remove()
    }
  }
}`;

content.replace(oldImage, newImage);

fs.writeFileSync(filePath, content);
console.log('✅ Fixed functions');
