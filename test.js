
let cube = document.createElement('img');
cube.classList.add('cube');
cube.setAttribute('src', 'https://shfb.yunban.com.cn/jumping_little_rabbit_2d/assets/images/rabbit.png');
cube.style.transform = 'scaleY(1.0) translate3d(0,-270%,0)';
cube.style.zIndex = 2;
cube.style.bottom=80 + "%";
cube.style.left=10  + "%";
$(".scene").append(cube);
console.log(123);
