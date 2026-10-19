# 日子有你

一个以手机竖屏为主的互动生日网页。包含家居物件、使用说明书、照片轮播、生日信、蜡烛和可开关的钢琴背景音乐。仓库里的公开示例使用 **25 岁**和虚构时间线；没有上传家庭照片、访问密码或加密密钥。

## 本地制作

需要 Node.js 22 或更新版本。

1. 编辑 `public/index.html`、`public/script.js` 中的称呼和文字。
2. 在终端运行 `node build-protected.mjs`，按提示输入自己设置的访问密码。程序生成 `build/index.html`、`build/payload.bin`、`build/music.bin`，以及本地私钥文件 `private/key.bin`。不要把 `private/` 放进网站目录。
3. 可选：把 JPG、PNG 或 WebP 照片放进 `photos/`，运行 `node server/process-photos.mjs`。照片在 `build/media/` 中加密后按文件名顺序自动轮播。也可以传入别的照片目录：`node server/process-photos.mjs /path/to/photos`。支持最多 30 张，每张不超过 20 MB。
4. 将 `build/` **目录内的文件**上传到支持 HTTPS 的静态网站空间，用 `index.html` 地址访问。需要 HTTPS 才能在浏览器中解密内容和使用吹蜡烛的麦克风功能。

运行网站后，访客输入密码才能解开正文、音乐和照片。密码由使用者在本机输入，不写入源码；照片原件也只留在本机。请只发布 `build/` 内的加密文件，别发布 `public/`、`photos/` 或 `private/`。生日日期这类容易猜到的密码安全性有限，分享链接时请自行权衡。

## 音乐来源

背景钢琴旋律和编排为本项目制作，使用 [Versilian Community Sample Library 的 Kawai 钢琴采样](https://github.com/sgossner/VCSL)，采样按 CC0 授权。仓库包含压缩后的成品音乐；如果想重新生成，安装 Python 3、NumPy、SciPy 和 FFmpeg，然后运行 `python3 audio/render_piano.py`，脚本会下载原始采样到本机。
