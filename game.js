(function(window, doc) {


    let Game = function() {

        this.scene = doc.querySelector('.scene'); //游戏场景
        this.controller =null; //游戏控制器
        this.role = null; //游戏主角，也就是兔兔
        this.cube = []; //存放方块dom的数组
        this.curCubeIndex = null; //当前所在方块索引
        this.sceneWidth = getNum(window.getComputedStyle(this.scene).width);
        this.sceneHeight = getNum(window.getComputedStyle(this.scene).height);
        this.cubeImg = [
            'https://shfb.yunban.com.cn/jumping_little_rabbit_2d/assets/images/cube0.png?v=13',
            'https://shfb.yunban.com.cn/jumping_little_rabbit_2d/assets/images/cube1.png?v=13',
            'https://shfb.yunban.com.cn/jumping_little_rabbit_2d/assets/images/cube2.png?v=13',
            'https://shfb.yunban.com.cn/jumping_little_rabbit_2d/assets/images/cube3.png?v=13',
            'https://shfb.yunban.com.cn/jumping_little_rabbit_2d/assets/images/cube4.png?v=13',
            'https://shfb.yunban.com.cn/jumping_little_rabbit_2d/assets/images/cube5.png?v=13',
            'https://shfb.yunban.com.cn/jumping_little_rabbit_2d/assets/images/cube6.png?v=13',
            'https://shfb.yunban.com.cn/jumping_little_rabbit_2d/assets/images/cube7.png?v=13',
            'https://shfb.yunban.com.cn/jumping_little_rabbit_2d/assets/images/cube8.png?v=13',
            'https://shfb.yunban.com.cn/jumping_little_rabbit_2d/assets/images/cube9.png?v=13',
            'https://shfb.yunban.com.cn/jumping_little_rabbit_2d/assets/images/cube10.png?v=13'
        ];
        this.isReadyToJump = false; //是否可以跳跃（检测充能状态）
        this.isJumping = false; //是否正在跳跃
        this.jumpStat = { //跳跃状态参数
            posS: { //position start: 起跳位置
                bottom: 0,
                left: 0
            },
            posE: { //跳跃终点位置
                bottom: 0,
                left: 0
            },
            distX: 0, //网页坐标系X轴距离 Math.abs(this.posS.left - this.posE.left)
            distY: 0, //网页坐标系Y轴距离 Math.abs(this.posS.bottom - this.posE.bottom)
            bevelAngle: 0, //斜角
            distH: 0, //水平方向距离
            distV: 8, //固定跳跃的垂直方向距离，是控制轨迹的重要参数，需要在此处手动设定
            time: 0.65, //设定跳跃时间，单位second，速度由time得出，是控制轨迹的重要参数，需要在此处手动设定
            frames: 0, //由time确定的总帧数，将在Game实例被初始化时自动计算
            vH: 0, //水平方向速度
            vV: 0, //垂直方向速度
            accV: 0, //垂直方向加速度
            vX: 0, //网页坐标系X轴方向速度
            vY: 0, //网页坐标系Y轴方向速度
            vCHX: 0, //水平速度在网页坐标系X轴上的分量 velocity component horizental X
            vCHY: 0, //水平速度在网页坐标系Y轴上的分量 velocity component horizental Y
            vCVX: 0, //垂直速度在网页坐标系X轴上的分量 velocity component vertical X
            vcVY: 0, //垂直速度在网页坐标系Y轴上的分量 velocity component vertical Y
            frame: 0 //当前帧数
        };
        this.jumpStat.frames = Math.ceil(this.jumpStat.time / 0.016667); //对于大多数显示器通常一帧为16-17ms
        this.isUpdateCameraExecutedInOnceJump = false; //标识在单次跳跃中是否已执行过更新镜头函数的变量，防止更新镜头函数多次执行
    };



    Game.prototype = {
        init: function () {
            this.initScene(); //初始化场景
            this.initController(); //初始化控制器
        },

        initScene: function() {

            //方块掉下来
            for (let i = 0; i < 11; i++) {
                let cube = doc.createElement('img');
                cube.classList.add('cube');
                cube.setAttribute('src', this.cubeImg[i]);
                cube.style.transform = 'scaleY(1.0) translate3d(0,-270%,0)';
                cube.style.zIndex = 2;
                if (this.cube.length) { //从第二个方块开始，按照上一个方块的位置取一定间距进行排列
                    if (3 != i && 4 != i && 7 != i && 10!= i) { //方向相对上一个方块向右
                        cube.style.bottom = getNum(this.cube[i - 1].style.bottom) - 6 + '%'; //为什么用bottom呢？因为方块的顶部参差不齐，以底部为准才方便排列位置
                        cube.style.left = getNum(this.cube[i - 1].style.left) - 18 + '%';
                    } else {
                        cube.style.bottom = getNum(this.cube[i - 1].style.bottom) - 6 + '%';
                        cube.style.left = getNum(this.cube[i - 1].style.left) + 18 + '%';
                    }
                } else {
                    cube.style.bottom = '85%';
                    cube.style.left = '75%';
                }
                this.cube.push(cube);
                this.scene.appendChild(cube);
            }


            /* 第一个方块在场景初始化时自动掉落 */
            this.cube[0].style.transform = 'scaleY(1.0) translate3d(0,-200%,0)';
            this.cube[0].style.display = 'block';
            this.cube[0].classList.add('cubeFall');
            this.cube[0].style.zIndex = '1';

            this.curCubeIndex = -1; //初始化当前方块索引
            this.nextCube = this.cube[1]; //初始化下一个方块索引


            /* 生成兔兔(role)*/
            let role = doc.createElement('img');
            role.classList.add('role');
            role.setAttribute('src', 'https://shfb.yunban.com.cn/jumping_little_rabbit_2d/assets/images/rabbit.png');
            role.style.bottom = getNum(this.cube[0].style.bottom) + 10 + '%';  //bottom和left的计算??????
            role.style.left = '105%';
            this.role = role;
            this.role.style.zIndex = 7;
            this.scene.appendChild(role);

            /* 初始化视图为场景右上角 */
            this.scene.style.top = 0;
            this.scene.style.right = 0;

        },
        initController: function() {

            this.controller = this.scene;
            doc.addEventListener('touchmove', event => { //全局禁止默认滑动事件
                event.preventDefault();
                event.stopPropagation();
            }, {passive: false});
            doc.addEventListener('touchstart', event => { //全局禁止默认触摸开始事件
                event.preventDefault();
                event.stopPropagation();
            }, {passive: false});
            doc.addEventListener('touchend', event => { //全局禁止默认触摸结束事件
                event.preventDefault();
                event.stopPropagation();
            }, {passive: false});
            this.controller.addEventListener('touchmove', event => { //禁止控制器的默认滑动事件
                event.preventDefault();
                event.stopPropagation();
            }, {passive: false});

            /* 按压开始的事件处理 */
            this.controller.addEventListener('touchstart', event => {
                event.preventDefault();
                event.stopPropagation();
                if (!this.isJumping) {
                    this.jumpCharge(event);
                }
            }, {passive: false});

            /* 按压结束的事件处理 */
            this.controller.addEventListener('touchend', event => {
                event.preventDefault();
                event.stopPropagation();
                if (this.isReadyToJump) {
                    this.jumpStart(event);
                }
            }, {passive: false});
        },


        //蓄力状态
        jumpCharge: function() {

            if (-1 == this.curCubeIndex) { //点击开始跳跃按钮时自动从场景外跳向魔方
                this.isReadyToJump = true;
                return;
            }

            let roleScaleY = getNum(/scale.*?\)/.exec(this.role.style.transform));
            let curCubeScaleY = getNum(this.cube[this.curCubeIndex].style.transform);

            if (!this.isJumping && 10 != this.curCubeIndex) { //不处于跳跃状态且不在最后一个方块(领奖台)时才能蓄力
                if (curCubeScaleY > 0.9) { //控制方块按压的最大形变程度
                    let roleBottom = getNum(this.role.style.bottom);
                    let curCubeHeight = this.cube[this.curCubeIndex].height;

                    /* 按压时使方块在网页坐标系Y轴上的形变每帧递减，兔兔的bottom值同样每帧递减形成一个微小的向下位移，增加真实感 */
                    if (1 === this.curCubeIndex) { //因为第二个方块比较高，所以形变要小一点，所以单独处理

                        //这边的transform里面的数据？？？？？？
                        this.cube[this.curCubeIndex].style.transform = 'scaleY(' + (curCubeScaleY - 0.00175) + ')'; //没来得及把这些参数给抽成对象属性，要改的时候就直接改吧，对应上就行
                        this.role.style.bottom = (roleBottom - (100 * 0.0001 * curCubeHeight / this.sceneHeight)) + '%';
                    } else {
                        this.cube[this.curCubeIndex].style.transform = 'scaleY(' + (curCubeScaleY - 0.00175) + ')';
                        this.role.style.bottom = (roleBottom - (100 * 0.0002 * curCubeHeight / this.sceneHeight)) + '%';
                    }


                    /* 跳到特定方块上时，兔子要转向 */
                    if (2 === this.curCubeIndex || 3 == this.curCubeIndex || 6 == this.curCubeIndex || 9 == this.curCubeIndex) {
                        this.role.setAttribute('src', 'https://shfb.yunban.com.cn/jumping_little_rabbit_2d/assets/images/rabbit_180.png');
                        this.role.style.transform = 'scaleY(' + (roleScaleY - 0.003) + ')';
                    } else {
                        this.role.setAttribute('src', 'https://shfb.yunban.com.cn/jumping_little_rabbit_2d/assets/images/rabbit.png');
                        this.role.style.transform = 'scaleY(' + (roleScaleY - 0.003) + ')';
                    }
                } else {
                    this.cube[this.curCubeIndex].style.transform = 'scaleY(0.9)';
                }
                this.isReadyToJump = true; //当蓄力事件被触发时则进入可以跳跃的状态
            }

            if (true === this.isReadyToJump) {
                requestAnimationFrame(() => {this.jumpCharge()});
            } //在蓄力状态中通过requestAnimationFrame方法进行帧递归形成动画效果
        },


        /* 蓄力结束，开始跳跃，处理一些跳跃中或跳跃后需要用到的参数和事件 */
        jumpStart: function() {

            if (!this.isJumping && this.isReadyToJump && 10 != this.curCubeIndex) {
                this.isReadyToJump = false; //退出蓄力状态
                this.isJumping = true; //进入跳跃状态
                this.role.setAttribute('src', 'https://shfb.yunban.com.cn/jumping_little_rabbit_2d/assets/images/rabbit_rolling.gif'); //替换成兔子旋转gif
                if (2 == this.curCubeIndex || 3 == this.curCubeIndex || 6 == this.curCubeIndex || 9 == this.curCubeIndex) {
                    this.role.setAttribute('src', 'https://shfb.yunban.com.cn/jumping_little_rabbit_2d/assets/images/rabbit_rolling_180.gif?v=2');
                }
                /* 松开按压时计算相应的跳跃状态初始参数 */
                this.jumpStat.posS = { //记录role的起跳位置
                    bottom: getNum(this.role.style.bottom),
                    left: getNum(this.role.style.left)
                };

                /* 对位置进行微调 */
                let bottomInc, leftInc;
                if (0 == this.curCubeIndex) {
                    bottomInc = 1.1;
                    leftInc = -1;
                } else if (1 == this.curCubeIndex) {
                    bottomInc = 1.8;
                    leftInc = 1;
                } else if (8 == this.curCubeIndex) {
                    bottomInc = 1.5;
                    leftInc = 1.25;
                } else if (9 == this.curCubeIndex) {
                    bottomInc = 2.4;
                    leftInc = 1.2;
                } else {
                    bottomInc = 2.2;
                    leftInc = 0.5;
                }

                this.jumpStat.posE = { //记录下一个跳跃终点位置
                    bottom: getNum(this.cube[this.curCubeIndex + 1].style.bottom) + bottomInc,
                    left: getNum(this.cube[this.curCubeIndex + 1].style.left) + leftInc
                };

                /* 将网页坐标系的速度向量分解到模拟坐标系中，参数按照自由落体公式进行计算 */
                this.jumpStat.distX = Math.abs(this.jumpStat.posS.left - this.jumpStat.posE.left);
                this.jumpStat.distY = Math.abs(this.jumpStat.posS.bottom - this.jumpStat.posE.bottom);
                this.jumpStat.bevelAngle = Math.atan(this.jumpStat.distY / this.jumpStat.distX);

                this.jumpStat.distH = this.jumpStat.distY / Math.sin(this.jumpStat.bevelAngle);
                this.jumpStat.vH = - (this.jumpStat.distH / (this.jumpStat.time / 0.016667)); //因为定位用的是left，所以水平速度应该是负的
                this.jumpStat.vCHX = this.jumpStat.vH * Math.cos(this.jumpStat.bevelAngle); //由于水平方向恒速，分量在此计算一次即可，控制跳跃运动过程的函数jumpMove中只要计算垂直方向速度即可
                this.jumpStat.vCHY = this.jumpStat.vH * Math.sin(this.jumpStat.bevelAngle);

                //????????
                this.jumpStat.accV = - (this.jumpStat.distV * 2 / Math.pow(this.jumpStat.frames / 2, 2)); //模拟自由落体运动的加速度，因为定位用的是bottom，所以这里加速度应该是负的
                //????????
                this.jumpStat.vV = - (this.jumpStat.accV * this.jumpStat.frames / 2); //垂直方向初始速度，与加速度方向相反

                this.jumpMove(); //进入跳跃的移动过程
            }
        },
        /* 控制role向下一个方块跳跃 */
        jumpMove: function() {
            let roleScaleY = getNum(/scaleY.+/.exec(this.role.style.transform));
            /* 当兔兔的Y轴方向形变小于1时要按帧递减(恢复原始形变) */
            if (roleScaleY < 1) {
                if (2 == this.curCubeIndex || 3 == this.curCubeIndex || 6 == this.curCubeIndex || 9 == this.curCubeIndex) { //跳跃过程中也要保证兔兔朝向正确
                    this.role.style.transform = 'scaleY(' + (roleScaleY + 0.05) + ')';
                } else {
                    this.role.style.transform = 'scaleY(' + (roleScaleY + 0.05) + ')';
                }
            } else {
                if (2 == this.curCubeIndex || 3 == this.curCubeIndex || 6 == this.curCubeIndex || 9 == this.curCubeIndex) {
                    this.role.style.transform = 'scaleY(1)';
                } else {
                    this.role.style.transform = 'scaleY(1)';
                }
            }

            let roleLeft = getNum(this.role.style.left);
            let roleBottom = getNum(this.role.style.bottom);

            this.jumpStat.vV += this.jumpStat.accV; //垂直方向速度受重力加速度影响
            this.jumpStat.vCVX = this.jumpStat.vV * Math.sin(this.jumpStat.bevelAngle); //分解速度向量到网页坐标系
            this.jumpStat.vCVY = this.jumpStat.vV * Math.cos(this.jumpStat.bevelAngle);

            this.jumpStat.vX = this.jumpStat.vCHX + this.jumpStat.vCVX; //将速度分量合并得到正确的网页坐标系X轴与Y轴方向速度
            this.jumpStat.vY = this.jumpStat.vCHY + this.jumpStat.vCVY;


            /* 通过兔兔当前位置与跳跃目标位置的差值绝对值判断兔兔是否跳到方块上 */
            //这边的参数？？？？？？？？？？？？？
            if (Math.abs(roleLeft - this.jumpStat.posE.left) > 0.5 || Math.abs(roleBottom - this.jumpStat.posE.bottom) > 0.5) {
                if (Math.abs(roleLeft - this.jumpStat.posE.left) > 0.5) {
                    if (2 == this.curCubeIndex || 3 == this.curCubeIndex || 6 == this.curCubeIndex || 9 ==this.curCubeIndex) {
                        this.role.style.left = (roleLeft - this.jumpStat.vX) + '%';
                    } else {
                        this.role.style.left = (roleLeft + this.jumpStat.vX) + '%';
                    }
                } else {
                    this.role.style.left = this.jumpStat.posE.left + '%';
                }
                if (Math.abs(roleBottom - this.jumpStat.posE.bottom) > 0.3) {
                    this.role.style.bottom = (roleBottom + this.jumpStat.vY) + '%';
                } else {
                    this.role.style.bottom = this.jumpStat.posE.bottom + '%';
                }
                requestAnimationFrame(() => {this.jumpMove()});
            } else { //已跳跃到目标位置
                this.jumpDone(); //执行跳跃完成后的处理行为
            }
        },

        jumpDone: function(){

            this.role.setAttribute('src', 'https://shfb.yunban.com.cn/jumping_little_rabbit_2d/assets/images/rabbit.png'); //换回静态兔兔图片

            this.isJumping = false; //退出跳跃状态

            this.curCubeIndex++; //跳跃完成后当前方块更新为下一个方块

            if (this.cube.length - 1 == this.curCubeIndex) { //如果更新后当前方块为最后一个方块，则完成游戏，显示完成界面并终止后续处理
                this.cube[this.curCubeIndex - 1].setAttribute('src', this.cubeImg[this.curCubeIndex - 1]);
                this.updateCamera();
              console.log("Game completed!!!");
                return;
            }

            /* 定制跳跃到指定方块上时要执行的处理 */
            if (0 == this.curCubeIndex) { //初始化场景时兔兔由场景外跳跃到魔方上
                this.nextCubeFall();
                return;
            }

            this.nextCubeFall(); //下一个方块掉落

            /* 兔兔转向并恢复形变 */
            if (2 == this.curCubeIndex || 3 == this.curCubeIndex || 6 == this.curCubeIndex || 9 == this.curCubeIndex) {
                //this.role.style.transform = 'rotate3d(0,1,0,180deg) scaleY(1)';
                this.role.setAttribute('src', 'https://shfb.yunban.com.cn/jumping_little_rabbit_2d/assets/images/rabbit_180.png');
                this.role.style.transform = 'scaleY(1)';
            } else {
                //this.role.style.transform = 'rotate3d(0,1,0,0deg) scaleY(1)';
                this.role.setAttribute('src', 'https://shfb.yunban.com.cn/jumping_little_rabbit_2d/assets/images/rabbit.png');
                this.role.style.transform = 'scaleY(1)';
            }

            /* 当单次跳跃中未执行过镜头位置更新函数时，执行之 */
            if (!this.isUpdateCameraExecutedInOnceJump) {
                this.updateCamera();
                this.isUpdateCameraExecutedInOnceJump = true;
            }
        },

        nextCubeFall: function() {
            this.cube[this.curCubeIndex + 1].style.display = 'block';
            this.cube[this.curCubeIndex + 1].classList.add('cubeFall');
            setTimeout(() => {
                this.cube[this.curCubeIndex + 1].classList.remove('cubeFall');
                this.cube[this.curCubeIndex + 1].style.transform = 'scaleY(1) translate3d(0,0,0)';
            }, 500);
        },


        updateCamera: function() {
            let needUpdate = false; //标识是否需要更新镜头位置
            let curCubeOffsetLeft = this.cube[this.curCubeIndex].offsetLeft;
            let curCubeOffsetWidth = this.cube[this.curCubeIndex].offsetWidth;
            let curCubeOffsetTop = this.cube[this.curCubeIndex].offsetTop;
            let curCubeOffsetHeight = this.cube[this.curCubeIndex].offsetHeight;

            if (10 != this.curCubeIndex) {
                let nextCubeOffsetLeft = this.cube[this.curCubeIndex + 1].offsetLeft;
                let nextCubeOffsetWidth = this.cube[this.curCubeIndex + 1].offsetWidth;
                let nextCubeOffsetTop = this.cube[this.curCubeIndex + 1].offsetTop;
                let nextCubeOffsetHeight = this.cube[this.curCubeIndex + 1].offsetHeight;
            }
            let camera;

            if (2 === this.curCubeIndex || 3 === this.curCubeIndex || 6 === this.curCubeIndex || 9 === this.curCubeIndex) {
                camera = {
                    target: {
                        //????????why 4??
                        x: curCubeOffsetLeft + curCubeOffsetWidth / 4, //(curCubeOffsetLeft + nextCubeOffsetLeft + nextCubeOffsetWidth) / 2,
                        y: curCubeOffsetTop + curCubeOffsetHeight / 2 //(curCubeOffsetTop + nextCubeOffsetTop + nextCubeOffsetHeight) / 2
                    }
                };
            } else {
                camera = {
                    target: {
                        x: curCubeOffsetLeft + curCubeOffsetWidth / 4, //(curCubeOffsetLeft + curCubeOffsetWidth + nextCubeOffsetLeft) / 2,
                        y: curCubeOffsetTop + curCubeOffsetHeight / 2 //(curCubeOffsetTop + nextCubeOffsetTop + nextCubeOffsetHeight) / 2
                    }
                };
            }
            let windowCenter = {
                x: window.innerWidth / 2,
                y: window.innerHeight / 2
            };

            let sceneTop = parseFloat(this.scene.style.top.substr(0, this.scene.style.top.length - 2)); //把末尾的'px'去掉
            let sceneRight = parseFloat(this.scene.style.right.substr(0, this.scene.style.right.length - 2)); //把末尾的'px'去掉
            if (camera.target.y - Math.abs(sceneTop) < window.innerHeight / 2 - 6 && sceneTop <= -3) {
                this.scene.style.top = (sceneTop + 6) + 'px';
                needUpdate = true;
            } else if (camera.target.y - Math.abs(sceneTop) > window.innerHeight / 2 + 6) {
                this.scene.style.top = (sceneTop - 6) + 'px';
                needUpdate = true;
            }
            if (this.scene.clientWidth - camera.target.x - Math.abs(sceneRight) < window.innerWidth / 2 - 6 && sceneRight <= -3) {
                this.scene.style.right = (sceneRight + 6) + 'px';
                needUpdate = true;
            } else if (this.scene.clientWidth - camera.target.x - Math.abs(sceneRight) > window.innerWidth / 2 + 6) {
                this.scene.style.right = (sceneRight - 6) + 'px';
                needUpdate = true;
            }
            if (needUpdate) {
                requestAnimationFrame(() => {
                    this.updateCamera();
                });
            } else {
                this.isUpdateCameraExecutedInOnceJump = false;
                return;
            }
        },
        moveRoleToCube: function(cubeIndex) {
            this.curCubeIndex = cubeIndex;

            let bottomInc, leftInc;
            /* 这些位置可能还要微调 */
            if (1 == cubeIndex) {
                bottomInc = 1.2;
                leftInc = -0.25;
            } else if (2 == cubeIndex) {
                bottomInc = 1.9;
                leftInc = 1.25;
            } else if (9 == cubeIndex) {
                bottomInc = 1.75;
                leftInc = 1.25;
            } else if (10 == cubeIndex) {
                bottomInc = 2.4;
                leftInc = 1.2;
            } else {
                bottomInc = 2.2;
                leftInc = 0.5;
            }

            /* 兔兔转向 */
            if (2 == cubeIndex || 3 == cubeIndex || 6 == cubeIndex || 9 == cubeIndex) {
                //this.role.style.transform = 'rotate3d(0,1,0,180deg) scaleY(1)';
                this.role.setAttribute('src', 'https://shfb.yunban.com.cn/jumping_little_rabbit_2d/assets/images/rabbit_180.png');
                this.role.style.transform = 'scaleY(1)';
            } else {
                //this.role.style.transform = 'rotate3d(0,1,0,0deg) scaleY(1)';
                this.role.setAttribute('src', 'https://shfb.yunban.com.cn/jumping_little_rabbit_2d/assets/images/rabbit.png');
                this.role.style.transform = 'scaleY(1)';
            }

            this.role.style.bottom = getNum(this.cube[cubeIndex].style.bottom) + bottomInc + '%';
            this.role.style.left = getNum(this.cube[cubeIndex].style.left) + leftInc + '%';
        }
    };




    window.Game = Game;
    })(window,document);

/* 从字符串中提取浮点数 */
function getNum(string) {
    return parseFloat(/(\d+.\d+)|(\d+)/.exec(string));
}