document.addEventListener('DOMContentLoaded', () => {

    const splashScreen  = document.getElementById('splash-screen');
    const desktop       = document.getElementById('desktop');
    const dockContainer = document.querySelector('.dock-container');
    const dockItems     = document.querySelectorAll('.dock-item');
    const appWindows    = document.getElementById('appWindows');

    const minimizedWindows = new Set();
    const maximizedWindows = new Set();
    let   currentHovered   = -1;

    const hideSplash = () => {
        splashScreen.classList.add('splash-exit');
        setTimeout(() => {
            splashScreen.style.display = 'none';
            desktop.style.display      = 'block';
            initMacOS();
        }, 500);
    };

    setTimeout(hideSplash, 3_000);
    splashScreen.addEventListener('click', hideSplash);

    function initMacOS() {
        initDropdowns();
        initClock();
        initDockAnimations();
        console.log('macOS-Web ready 🚀');
    }

    function initDropdowns() {
        document.addEventListener('click', e => {
            const trigger = e.target.closest('[data-dropdown]');
            if (trigger) {
                e.stopPropagation();
                document.querySelectorAll('.menu-item.open')
                        .forEach(el => el !== trigger && el.classList.remove('open'));
                trigger.classList.toggle('open');
                return;
            }
            if (!e.target.closest('.dropdown-menu')) {
                document.querySelectorAll('.menu-item.open')
                        .forEach(el => el.classList.remove('open'));
            }
        });

        document.addEventListener('keydown', e => {
            if (e.key === 'Escape') {
                document.querySelectorAll('.menu-item.open')
                        .forEach(el => el.classList.remove('open'));
            }
        });
    }

    function initClock() {
        const clock = document.getElementById('clock');
        if (!clock) return;
        const tick = () => clock.textContent =
            new Date().toLocaleTimeString(undefined,
                { hour: '2-digit', minute: '2-digit' });
        tick();
        setInterval(tick, 60_000);
    }

    function initDockAnimations() {
        if (!dockContainer || dockItems.length === 0) return;

        gsap.set(dockItems, { scale: 1, y: 0, transformOrigin: 'bottom center' });

        function updateDock(idx = -1) {
            currentHovered = idx;

            dockItems.forEach((item, i) => {
                const tooltip = item.querySelector('.dock-tooltip');
                const tween   = (s, y) => gsap.to(item,
                    { scale: s, y, duration: 0.4, ease: 'back.out(1.7)' });

                if (i === idx) {
                    tween(1.6, -20);
                    tooltip && gsap.to(tooltip, { opacity: 1, y: -2, duration: 0.3 });
                } else if (Math.abs(i - idx) === 1) {
                    tween(1.25, -10);
                    tooltip && gsap.to(tooltip, { opacity: 0, y: 0, duration: 0.2 });
                } else if (Math.abs(i - idx) === 2) {
                    tween(1.12, -5);
                    tooltip && gsap.to(tooltip, { opacity: 0, y: 0, duration: 0.2 });
                } else {
                    tween(1, 0);
                    tooltip && gsap.to(tooltip, { opacity: 0, y: 0, duration: 0.2 });
                }
            });
        }

        dockContainer.addEventListener('mousemove', e => {
            const item = e.target.closest('.dock-item');
            if (!item) return;
            const idx  = [...dockItems].indexOf(item);
            if (idx !== currentHovered) updateDock(idx);
        }, true);

        dockContainer.addEventListener('mouseleave', () => updateDock(-1));

        dockContainer.addEventListener('click', e => {
            const item = e.target.closest('.dock-item');
            item && openApp(item.dataset.app);
        });

        gsap.fromTo(dockContainer,
            { y: 100, opacity: 0, scale: 0.8 },
            { y: 0,   opacity: 1, scale: 1, duration: 0.8,
              ease: 'back.out(1.7)', delay: 0.5 });
    }

    const topZ = () => Math.max(1000,
        ...[...document.querySelectorAll('.app-window')]
        .map(el => +el.style.zIndex || 1000));

    const bringToFront = win => {
        win.style.zIndex = topZ() + 1;
        gsap.fromTo(win, { scale: 0.98 }, { scale: 1, duration: 0.2, ease: 'power2.out' });
    };

    const makeDraggable = win => {
        const bar = win.querySelector('.window-titlebar');
        if (!bar) return;

        let sx = 0, sy = 0, sl = 0, st = 0, dragging = false;

        bar.addEventListener('mousedown', e => {
            if (e.target.classList.contains('window-control')) return;
            dragging = true;
            sx = e.clientX; sy = e.clientY;
            const r = win.getBoundingClientRect();
            sl = r.left;   st = r.top;
            bringToFront(win);
            document.addEventListener('mousemove', drag);
            document.addEventListener('mouseup', stop);
        });

        const drag = e => {
            if (!dragging) return;
            win.style.left =
                Math.min(Math.max(0, sl + e.clientX - sx), window.innerWidth  - 200) + 'px';
            win.style.top  =
                Math.min(Math.max(28, st + e.clientY - sy), window.innerHeight - 100) + 'px';
        };
        const stop = () => {
            dragging = false;
            document.removeEventListener('mousemove', drag);
            document.removeEventListener('mouseup', stop);
        };
    };

    function openApp(app) {
        let win = document.getElementById(`${app}-window`);
        if (win) {
            minimizedWindows.has(app) ? restoreWindow(win, app) : bringToFront(win);
            return;
        }

        const size = {
            finder:      { w: 800, h: 600 },
            safari:      { w: 900, h: 700 },
            calculator:  { w: 360, h: 500 },
            terminal:    { w: 700, h: 500 }
        }[app] || { w: 600, h: 400 };

        win = document.createElement('div');
        win.id        = `${app}-window`;
        win.className = 'app-window';
        win.style.cssText = `
            width:${size.w}px;height:${size.h}px;
            left:100px;top:100px;z-index:${topZ() + 1};`;

        Object.assign(win.dataset, {
            originalWidth : `${size.w}px`,
            originalHeight: `${size.h}px`,
            originalLeft  : '100px',
            originalTop   : '100px'
        });

        win.innerHTML = getAppTemplate(app);
        appWindows.appendChild(win);

        gsap.fromTo(win,
            { scale: 0.3, opacity: 0, rotationY: 90, transformOrigin: 'center' },
            { scale: 1,   opacity: 1, rotationY: 0, duration: 0.6,
              ease: 'back.out(1.7)' });

        makeDraggable(win);
        initWindowControls(win, app);
        setTimeout(() => initApp(app, win), 100);
    }

    const restoreWindow = (win, app) => {
        minimizedWindows.delete(app);
        win.classList.remove('minimized');
        gsap.set(win, { display: 'block' });
        gsap.fromTo(win,
            { scale: 0.1, y: window.innerHeight - 100, opacity: 0 },
            { scale: 1,   y: 0, opacity: 1, duration: 0.6,
              ease: 'back.out(1.7)', onComplete: () => bringToFront(win) });
    };

    function initWindowControls(win, app) {
        const [close, min, max] = [
            '.close', '.minimize', '.maximize'
        ].map(sel => win.querySelector(`.window-control${sel}`));

        close && close.addEventListener('click', () => {
            minimizedWindows.delete(app);
            maximizedWindows.delete(app);
            gsap.to(win, { scale: 0.3, opacity: 0, duration: 0.3,
                           ease: 'power2.in', onComplete: () => win.remove() });
        });

        min && min.addEventListener('click', () => {
            minimizedWindows.add(app);
            win.classList.add('minimized');
            gsap.to(win, { scale: 0.1, y: window.innerHeight - 100, opacity: 0,
                           duration: 0.6, ease: 'power2.in',
                           onComplete: () => gsap.set(win, { display: 'none' }) });
        });

        max && max.addEventListener('click', () => {
            if (maximizedWindows.has(app)) {              
                maximizedWindows.delete(app);
                win.classList.remove('maximized');
                gsap.to(win, {
                    width : win.dataset.originalWidth,
                    height: win.dataset.originalHeight,
                    left  : win.dataset.originalLeft,
                    top   : win.dataset.originalTop,
                    duration: 0.4, ease: 'power2.out',
                    onComplete: () => win.style.resize = 'both'
                });
            } else {                                      
                maximizedWindows.add(app);
                win.style.resize = 'none';
                gsap.to(win, {
                    width:'100vw', height:'calc(100vh - 108px)',
                    left:0, top:28, duration:0.4, ease:'power2.out',
                    onComplete: () => win.classList.add('maximized')
                });
            }
        });

        win.addEventListener('mousedown', () => bringToFront(win));
    }

    function getAppTemplate(app) {
        const tpl = {

            safari: `
                <div class="window-titlebar">
                    <div class="window-controls">
                        <div class="window-control close"></div>
                        <div class="window-control minimize"></div>
                        <div class="window-control maximize"></div>
                    </div>
                    <div class="window-title">Safari</div>
                </div>
                <div class="app-content safari-content">
                    <iframe src="apps/safari.html"
                            style="width:100%;height:100%;
                                   border:none;border-radius:0 0 12px 12px;"></iframe>
                </div>`,

            finder: `
                <div class="window-titlebar">
                    <div class="window-controls">
                        <div class="window-control close"></div>
                        <div class="window-control minimize"></div>
                        <div class="window-control maximize"></div>
                    </div>
                    <div class="window-title">Finder</div>
                </div>
                <div class="app-content finder-content">
                    <div class="finder-sidebar">
                        <div class="sidebar-section">
                            <div class="sidebar-title">FAVORITES</div>
                            <div class="sidebar-item active"  data-path="Documents"><i class="ri-folder-line"></i> Documents</div>
                            <div class="sidebar-item"         data-path="Downloads"><i class="ri-download-line"></i> Downloads</div>
                            <div class="sidebar-item"         data-path="Pictures"><i class="ri-image-line"></i> Pictures</div>
                            <div class="sidebar-item"         data-path="Music"><i class="ri-music-line"></i> Music</div>
                        </div>
                        <div class="sidebar-section">
                            <div class="sidebar-title">DEVICES</div>
                            <div class="sidebar-item"         data-path="Documents"><i class="ri-hard-drive-line"></i> Macintosh HD</div>
                        </div>
                    </div>
                    <div class="finder-main">
                        <div class="file-grid"></div> <!-- populated by JS -->
                    </div>
                </div>`,

            calculator: `
                <div class="window-titlebar">
                    <div class="window-controls">
                        <div class="window-control close"></div>
                        <div class="window-control minimize"></div>
                        <div class="window-control maximize"></div>
                    </div>
                    <div class="window-title">Calculator</div>
                </div>
                <div class="app-content calculator-content">
                    <div class="calculator-display" id="calc-display">0</div>
                    <div class="calculator-buttons">
                        <button class="calc-btn function" onclick="clearCalc()">AC</button>
                        <button class="calc-btn function" onclick="toggleSign()">±</button>
                        <button class="calc-btn function" onclick="percentage()">%</button>
                        <button class="calc-btn operator" onclick="setOperator('÷')">÷</button>

                        <button class="calc-btn number" onclick="inputCalcNumber('7')">7</button>
                        <button class="calc-btn number" onclick="inputCalcNumber('8')">8</button>
                        <button class="calc-btn number" onclick="inputCalcNumber('9')">9</button>
                        <button class="calc-btn operator" onclick="setOperator('×')">×</button>

                        <button class="calc-btn number" onclick="inputCalcNumber('4')">4</button>
                        <button class="calc-btn number" onclick="inputCalcNumber('5')">5</button>
                        <button class="calc-btn number" onclick="inputCalcNumber('6')">6</button>
                        <button class="calc-btn operator" onclick="setOperator('−')">−</button>

                        <button class="calc-btn number" onclick="inputCalcNumber('1')">1</button>
                        <button class="calc-btn number" onclick="inputCalcNumber('2')">2</button>
                        <button class="calc-btn number" onclick="inputCalcNumber('3')">3</button>
                        <button class="calc-btn operator" onclick="setOperator('+')">+</button>

                        <button class="calc-btn number zero" onclick="inputCalcNumber('0')">0</button>
                        <button class="calc-btn number" onclick="inputDecimal()">.</button>
                        <button class="calc-btn equals" onclick="calculate()">=</button>
                    </div>
                </div>`,

            terminal: `
                <div class="window-titlebar">
                    <div class="window-controls">
                        <div class="window-control close"></div>
                        <div class="window-control minimize"></div>
                        <div class="window-control maximize"></div>
                    </div>
                    <div class="window-title">Terminal</div>
                </div>
                <div class="app-content terminal-content">
                    <div class="terminal-output" id="terminal-output">
                        <div class="terminal-line">Last login: ${new Date().toString()}</div>
                        <div class="terminal-line"><span class="prompt">user@macOS-Web % </span></div>
                    </div>
                    <div class="terminal-input-line">
                        <span class="prompt">user@macOS-Web % </span>
                        <input type="text" class="terminal-input" id="terminal-input" autocomplete="off">
                    </div>
                </div>`
        };
        return tpl[app] || '<div>App not found</div>';
    }

    let calcDisplay, calcOp = null, calcPrev = null, calcReset = false;

    window.inputCalcNumber = n => {
        calcDisplay ??= document.getElementById('calc-display');
        if (calcReset) { calcDisplay.textContent = '0'; calcReset = false; }
        calcDisplay.textContent =
            calcDisplay.textContent === '0' ? n : calcDisplay.textContent + n;
    };
    window.inputDecimal = () => {
        calcDisplay ??= document.getElementById('calc-display');
        if (calcReset) { calcDisplay.textContent = '0'; calcReset = false; }
        if (!calcDisplay.textContent.includes('.')) calcDisplay.textContent += '.';
    };
    window.setOperator = op => {
        calcDisplay ??= document.getElementById('calc-display');
        if (calcOp && !calcReset) window.calculate();
        calcPrev = calcDisplay.textContent; calcOp = op; calcReset = true;
    };
    window.calculate = () => {
        calcDisplay ??= document.getElementById('calc-display');
        if (!calcOp || calcPrev === null) return;
        const a = +calcPrev, b = +calcDisplay.textContent;
        const res = { '+': a+b, '−': a-b, '×': a*b, '÷': b!==0 ? a/b : 0 }[calcOp];
        calcDisplay.textContent = res.toString();
        calcOp = calcPrev = null; calcReset = true;
    };
    window.clearCalc  = () => { calcDisplay.textContent = '0'; calcOp = calcPrev = null; calcReset = false; };
    window.toggleSign = () => {
        if (calcDisplay.textContent !== '0')
            calcDisplay.textContent = calcDisplay.textContent.startsWith('-')
                ? calcDisplay.textContent.slice(1)
                : '-' + calcDisplay.textContent;
    };
    window.percentage = () =>
        calcDisplay.textContent = (+calcDisplay.textContent / 100).toString();

    const initCalculator = win => calcDisplay = win.querySelector('#calc-display');

    function initTerminal(win) {
        const input  = win.querySelector('#terminal-input');
        const output = win.querySelector('#terminal-output');
        input && setTimeout(() => input.focus(), 100);

        input.addEventListener('keypress', e => {
            if (e.key !== 'Enter') return;
            const cmd = input.value.trim(); input.value = '';
            if (!cmd) return;

            const addLine = html => {
                const div = document.createElement('div');
                div.className = 'terminal-line';
                div.innerHTML = html;
                output.appendChild(div);
            };

            addLine(`<span class="prompt">user@macOS-Web % </span>${cmd}`);

            const respond = txt => addLine(txt);

            switch (cmd) {
                case 'ls':   respond('Applications  Documents  Downloads  Desktop'); break;
                case 'pwd':  respond('/Users/user');                                 break;
                case 'date': respond(new Date().toString());                         break;
                case 'whoami':respond('user');                                       break;
                case 'clear': output.innerHTML = ''; break;
                case 'help': respond('ls, pwd, date, whoami, echo, clear, help');    break;
                default:
                    cmd.startsWith('echo ') ? respond(cmd.slice(5))
                                             : respond(`zsh: command not found: ${cmd}`);
            }
            addLine('<span class="prompt">user@macOS-Web % </span>');
            output.scrollTop = output.scrollHeight;
        });
    }

    function initFinder(win) {
        const fileGrid     = win.querySelector('.file-grid');
        const sidebarItems = win.querySelectorAll('.sidebar-item');

        const fs = {
            Documents: [
                { name:'Resume.pdf',   icon:'ri-file-pdf-line' },
                { name:'Notes.txt',    icon:'ri-file-text-line' },
                { name:'Projects',     icon:'ri-folder-line', isDir:true }
            ],
            Downloads: [
                { name:'Installer.dmg',icon:'ri-download-2-line' },
                { name:'Image.png',    icon:'ri-image-line' }
            ],
            Pictures: [
                { name:'Vacation',     icon:'ri-folder-line', isDir:true },
                { name:'Photo.jpg',    icon:'ri-image-line' }
            ],
            Music: [
                { name:'Song.mp3',     icon:'ri-music-line' }
            ]
        };

        const render = path => {
            const list = fs[path] || [];
            fileGrid.innerHTML = list.map(item => `
                <div class="file-item">
                    <i class="${item.icon}"></i>
                    <span>${item.name}</span>
                </div>`).join('');
        };

        sidebarItems.forEach(item => {
            item.addEventListener('click', () => {
                sidebarItems.forEach(el => el.classList.remove('active'));
                item.classList.add('active');
                render(item.dataset.path);
            });
        });

        render('Documents');   
    }

    function initApp(app, win) {
        if      (app === 'calculator') initCalculator(win);
        else if (app === 'terminal')   initTerminal(win);
        else if (app === 'finder')     initFinder(win);

    }
});