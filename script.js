// 首頁影片輪播邏輯
const videoList = ['./images/video/snow1.mp4', './images/video/snow2.mp4', './images/video/snow3.mp4'];
let currentIdx = 0;
const v1 = document.getElementById('video-1');
const v2 = document.getElementById('video-2');
let activeVideo = v1;

// 初始化
v1.src = videoList[0];
v2.src = videoList[1];

function switchVideo() {
    // 1. 決定下一個要播放的影片
    const nextIdx = (currentIdx + 1) % videoList.length;
    const nextVideo = (activeVideo === v1) ? v2 : v1;
    const idleVideo = (activeVideo === v1) ? v1 : v2;

    // 2. 開始播放下一段 (它現在在後台，看不見)
    nextVideo.src = videoList[nextIdx];
    nextVideo.play();

    // 3. 透過 CSS class 切換透明度
    nextVideo.classList.add('active');
    idleVideo.classList.remove('active');

    // 4. 更新狀態
    activeVideo = nextVideo;
    currentIdx = nextIdx;
}

// 每 3 秒切換一次
setInterval(switchVideo, 2500);

// 核心：視差滾動效果
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const hero = document.getElementById('hero-video-section');
    const content = document.getElementById('main-content-section');

    // 影片區塊移動速度較慢 (0.5)
    hero.style.transform = `translateY(${scrolled * 0.5}px)`;
    
    // 文字內容可以有不同的位移感
    const heroContent = document.querySelector('.hero-content');
    if(heroContent) {
        heroContent.style.opacity = 1 - (scrolled / 600); // 往下滑時文字慢慢變透明
    }
});

// 平滑滾動按鈕
document.getElementById('scroll-down-btn').addEventListener('click', () => {
    document.getElementById('main-content-section').scrollIntoView({ 
        behavior: 'smooth' 
    });
});