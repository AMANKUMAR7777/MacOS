document.addEventListener('DOMContentLoaded', () => {
    const splashScreen = document.getElementById('splash-screen');
    const desktop = document.getElementById('desktop');

    /* ---------- Splash-screen handling ------------------------------ */
    const hideSplash = () => {
        splashScreen.classList.add('splash-exit');
        setTimeout(() => {
            splashScreen.style.display = 'none';
            desktop.style.display = 'block';
            initMacOSInterface();
        }, 500);
    };

    // Auto-hide after 3 s
    setTimeout(hideSplash, 3000);

    // Click to skip
    splashScreen.addEventListener('click', hideSplash);

    /* ---------- Main init ------------------------------------------- */
    function initMacOSInterface() {
        initDropdowns();
        initClock();
        initGSAPDockAnimations();
        console.log('macOS interface loaded with GSAP animations');
    }

    /* ---------- Dropdown reusable component ------------------------- */
    function initDropdowns() {
        // Toggle open / close on click
        document.querySelectorAll('[data-dropdown]').forEach(drop => {
            drop.addEventListener('click', e => {
                e.stopPropagation();
                // Close other open menus
                document.querySelectorAll('.menu-item.open').forEach(openItem => {
                    if (openItem !== drop) openItem.classList.remove('open');
                });
                // Toggle current
                drop.classList.toggle('open');
            });
        });

        // Close menus when clicking outside
        document.addEventListener('click', () => {
            document.querySelectorAll('.menu-item.open')
                    .forEach(item => item.classList.remove('open'));
        });

        // Close on Esc
        window.addEventListener('keydown', e => {
            if (e.key === 'Escape') {
                document.querySelectorAll('.menu-item.open')
                        .forEach(item => item.classList.remove('open'));
            }
        });
    }

    /* ---------- Clock (top-right) ----------------------------------- */
    function initClock() {
        const clockEl = document.getElementById('clock');
        if (!clockEl) return;

        const update = () => {
            const now = new Date();
            const options = { hour: '2-digit', minute: '2-digit' };
            clockEl.textContent = now.toLocaleTimeString(undefined, options);
        };
        update();
        setInterval(update, 60_000);
    }

    /* ---------- GSAP Dock Animations -------------------------------- */
    function initGSAPDockAnimations() {
        const dockItems = document.querySelectorAll('.dock-item');
        const dockContainer = document.querySelector('.dock-container');
        let currentHoveredIndex = -1;
        
        // Set initial state
        gsap.set(dockItems, { 
            scale: 1, 
            y: 0,
            transformOrigin: "bottom center"
        });

        // Function to update all dock items based on hover state
        function updateDockItems(hoveredIndex = -1) {
            currentHoveredIndex = hoveredIndex;
            
            dockItems.forEach((item, index) => {
                const tooltip = item.querySelector('.dock-tooltip');
                
                if (index === hoveredIndex) {
                    // Animate the hovered item
                    gsap.to(item, {
                        scale: 1.6,
                        y: -20,
                        duration: 0.4,
                        ease: "back.out(1.7)"
                    });
                    
                    // Show tooltip
                    gsap.to(tooltip, {
                        opacity: 1,
                        y: -2,
                        duration: 0.3,
                        ease: "power2.out"
                    });
                    
                    // Enhanced background on hover
                    gsap.to(item, {
                        background: "linear-gradient(135deg, rgba(255, 255, 255, 0.35) 0%, rgba(255, 255, 255, 0.15) 100%)",
                        borderColor: "rgba(255, 255, 255, 0.5)",
                        duration: 0.3
                    });
                    
                } else if (Math.abs(index - hoveredIndex) === 1) {
                    // Animate neighboring items
                    gsap.to(item, {
                        scale: 1.25,
                        y: -10,
                        duration: 0.4,
                        ease: "back.out(1.7)"
                    });
                    
                    gsap.to(tooltip, {
                        opacity: 0,
                        y: 0,
                        duration: 0.2
                    });
                    
                } else if (Math.abs(index - hoveredIndex) === 2) {
                    // Animate second-level neighbors
                    gsap.to(item, {
                        scale: 1.12,
                        y: -5,
                        duration: 0.4,
                        ease: "back.out(1.7)"
                    });
                    
                    gsap.to(tooltip, {
                        opacity: 0,
                        y: 0,
                        duration: 0.2
                    });
                    
                } else {
                    // Reset other items
                    gsap.to(item, {
                        scale: 1,
                        y: 0,
                        duration: 0.4,
                        ease: "back.out(1.7)"
                    });
                    
                    gsap.to(tooltip, {
                        opacity: 0,
                        y: 0,
                        duration: 0.2
                    });
                    
                    // Reset background
                    gsap.to(item, {
                        background: "linear-gradient(135deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.1) 100%)",
                        borderColor: "rgba(255, 255, 255, 0.3)",
                        duration: 0.3
                    });
                }
            });
        }

        // Add hover event listeners
        dockItems.forEach((item, index) => {
            item.addEventListener('mouseenter', () => {
                updateDockItems(index);
            });

            // Click animation with GSAP
            item.addEventListener('click', () => {
                const app = item.dataset.app;
                console.log(`Opening ${app}`);
                
                // GSAP click animation
                const tl = gsap.timeline();
                tl.to(item, {
                    scale: 0.9,
                    duration: 0.1,
                    ease: "power2.out"
                })
                .to(item, {
                    scale: currentHoveredIndex === index ? 1.6 : 1,
                    duration: 0.2,
                    ease: "back.out(1.7)"
                });

                openApp(app);
            });
        });

        // Reset all items when mouse leaves dock container
        dockContainer.addEventListener('mouseleave', () => {
            updateDockItems(-1);
        });

        // Smooth dock container entrance animation
        gsap.fromTo(dockContainer, 
            { 
                y: 100, 
                opacity: 0,
                scale: 0.8
            },
            { 
                y: 0, 
                opacity: 1,
                scale: 1,
                duration: 0.8,
                ease: "back.out(1.7)",
                delay: 0.5
            }
        );
    }

    /* ---------- Enhanced Window System with GSAP -------------------- */
    const minimizedWindows = new Set();
    const maximizedWindows = new Set();

    function openApp(appName) {
        console.log(`Launching ${appName}...`);
        
        let windowContainer = document.getElementById(`${appName}-window`);

        if (windowContainer) {
            if (minimizedWindows.has(appName)) {
                restoreWindow(windowContainer, appName);
            } else {
                bringWindowToFront(windowContainer);
            }
            return;
        }

        // Create new window
        const appWindows = document.getElementById('appWindows');
        const windowId = `${appName}-window`;
        
        windowContainer = document.createElement('div');
        windowContainer.id = windowId;
        windowContainer.className = 'app-window';
        windowContainer.style.zIndex = getHighestZIndex() + 1;

        // Set app-specific default size
        const appSizes = {
            finder: { width: '800px', height: '600px' },
            safari: { width: '900px', height: '700px' },
            calculator: { width: '360px', height: '500px' },
            terminal: { width: '700px', height: '500px' }
        };
        const size = appSizes[appName] || { width: '600px', height: '400px' };
        windowContainer.style.width = size.width;
        windowContainer.style.height = size.height;

        const appContent = getAppContent(appName);
        windowContainer.innerHTML = appContent;

        // Store original size and position for restore
        windowContainer.dataset.originalWidth = size.width;
        windowContainer.dataset.originalHeight = size.height;
        windowContainer.dataset.originalLeft = '100px';
        windowContainer.dataset.originalTop = '100px';

        appWindows.appendChild(windowContainer);

        // Enhanced GSAP opening animation
        const tl = gsap.timeline();
        
        tl.fromTo(windowContainer,
            { 
                scale: 0.3, 
                opacity: 0,
                rotationY: 90,
                transformOrigin: "center center"
            },
            { 
                scale: 1, 
                opacity: 1,
                rotationY: 0,
                duration: 0.6,
                ease: "back.out(1.7)"
            }
        )
        .to(windowContainer, {
            y: 0,
            duration: 0.2,
            ease: "power2.out"
        }, "-=0.3");

        makeWindowDraggable(windowContainer);
        initWindowControls(windowContainer, appName);
        initAppFunctionality(appName, windowContainer);
        updateDockIndicator(appName);
    }

    function restoreWindow(windowElement, appName) {
        minimizedWindows.delete(appName);
        windowElement.classList.remove('minimized');
        
        // GSAP restore from minimize animation
        const tl = gsap.timeline();
        
        tl.set(windowElement, {
            display: 'block'
        })
        .fromTo(windowElement, 
            {
                scale: 0.1,
                y: window.innerHeight - 100,
                opacity: 0
            },
            {
                scale: 1,
                y: 0,
                x: 0,
                opacity: 1,
                duration: 0.6,
                ease: "back.out(1.7)",
                onComplete: () => {
                    bringWindowToFront(windowElement);
                }
            }
        );

        updateDockIndicator(appName);
    }

    function updateDockIndicator(appName) {
        const dockItem = document.querySelector(`[data-app="${appName}"]`);
        if (!dockItem) return;
        if (minimizedWindows.has(appName)) {
            dockItem.classList.add('has-minimized');
        } else {
            dockItem.classList.remove('has-minimized');
        }
    }

    /* ---------- Window Management Functions ----------------------- */
    function getHighestZIndex() {
        const windows = document.querySelectorAll('.app-window');
        let highest = 1000;
        windows.forEach(window => {
            const z = parseInt(window.style.zIndex || 1000);
            if (z > highest) highest = z;
        });
        return highest;
    }

    function bringWindowToFront(windowElement) {
        windowElement.style.zIndex = getHighestZIndex() + 1;
        
        // GSAP focus animation
        gsap.fromTo(windowElement, 
            { scale: 0.98 },
            { 
                scale: 1, 
                duration: 0.2, 
                ease: "power2.out" 
            }
        );
    }

    function makeWindowDraggable(windowElement) {
        const titlebar = windowElement.querySelector('.window-titlebar');
        let isDragging = false;
        let startX, startY, startLeft, startTop;

        titlebar.addEventListener('mousedown', (e) => {
            // Don't drag if clicking on window controls
            if (e.target.classList.contains('window-control')) return;
            
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            const rect = windowElement.getBoundingClientRect();
            startLeft = rect.left;
            startTop = rect.top;
            
            bringWindowToFront(windowElement);
            
            document.addEventListener('mousemove', drag);
            document.addEventListener('mouseup', stopDrag);
        });

        function drag(e) {
            if (!isDragging) return;
            
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            
            let newLeft = startLeft + deltaX;
            let newTop = startTop + deltaY;
            
            // Constrain to viewport
            newLeft = Math.max(0, Math.min(newLeft, window.innerWidth - 200));
            newTop = Math.max(28, Math.min(newTop, window.innerHeight - 100));
            
            windowElement.style.left = newLeft + 'px';
            windowElement.style.top = newTop + 'px';
        }

        function stopDrag() {
            isDragging = false;
            document.removeEventListener('mousemove', drag);
            document.removeEventListener('mouseup', stopDrag);
        }
    }

    function initWindowControls(windowElement, appName) {
        const closeBtn = windowElement.querySelector('.window-control.close');
        const minimizeBtn = windowElement.querySelector('.window-control.minimize');
        const maximizeBtn = windowElement.querySelector('.window-control.maximize');

        closeBtn.addEventListener('click', e => {
            e.stopPropagation();
            minimizedWindows.delete(appName);
            maximizedWindows.delete(appName);
            updateDockIndicator(appName);
            
            // GSAP close animation
            gsap.to(windowElement, {
                scale: 0.3,
                opacity: 0,
                duration: 0.3,
                ease: "power2.in",
                onComplete: () => windowElement.remove()
            });
        });

        minimizeBtn.addEventListener('click', e => {
            e.stopPropagation();
            minimizedWindows.add(appName);
            windowElement.classList.add('minimized');
            
            // GSAP minimize animation - scale down and slide to dock
            const tl = gsap.timeline();
            tl.to(windowElement, {
                scale: 0.1,
                y: window.innerHeight - 100, // Animate towards dock
                x: 0,
                opacity: 0,
                duration: 0.6,
                ease: "power2.in"
            })
            .set(windowElement, {
                display: 'none'
            });
            
            updateDockIndicator(appName);
        });

        maximizeBtn.addEventListener('click', e => {
            e.stopPropagation();
            
            if (maximizedWindows.has(appName)) {
                // GSAP restore animation
                maximizedWindows.delete(appName);
                
                const tl = gsap.timeline();
                
                // First, remove maximized class to allow CSS transitions
                tl.set(windowElement, {
                    className: windowElement.className.replace('maximized', '').trim()
                })
                // Animate back to original size and position
                .to(windowElement, {
                    width: windowElement.dataset.originalWidth,
                    height: windowElement.dataset.originalHeight,
                    left: windowElement.dataset.originalLeft,
                    top: windowElement.dataset.originalTop,
                    duration: 0.4,
                    ease: "power2.out",
                    onComplete: () => {
                        // Re-enable resize after animation
                        windowElement.style.resize = 'both';
                    }
                });

            } else {
                // GSAP maximize animation
                maximizedWindows.add(appName);

                // Save current size/position
                const rect = windowElement.getBoundingClientRect();
                windowElement.dataset.originalWidth = rect.width + 'px';
                windowElement.dataset.originalHeight = rect.height + 'px';
                windowElement.dataset.originalLeft = rect.left + 'px';
                windowElement.dataset.originalTop = rect.top + 'px';

                // Disable resize during maximize
                windowElement.style.resize = 'none';
                
                const tl = gsap.timeline();
                
                // Animate to maximized state
                tl.to(windowElement, {
                    width: '100vw',
                    height: 'calc(100vh - 108px)',
                    left: 0,
                    top: 28,
                    duration: 0.4,
                    ease: "power2.out"
                })
                // Add maximized class after animation for styling
                .set(windowElement, {
                    className: windowElement.className + ' maximized'
                });
            }
        });

        windowElement.addEventListener('mousedown', () => bringWindowToFront(windowElement));
    }

    /* ---------- App Content Templates ---------------------------- */
    function getAppContent(appName) {
        const appTemplates = {
            finder: `
                <div class="window-titlebar">
                    <div class="window-controls">
                        <div class="window-control close"></div>
                        <div class="window-control minimize"></div>
                        <div class="window-control maximize"></div>
                    </div>
                    <div class="window-title">Documents</div>
                </div>
                <div class="app-content finder-content">
                    <div class="finder-sidebar">
                        <div class="sidebar-section">
                            <div class="sidebar-title">FAVORITES</div>
                            <div class="sidebar-item active"><i class="ri-folder-line"></i> Documents</div>
                            <div class="sidebar-item"><i class="ri-download-line"></i> Downloads</div>
                            <div class="sidebar-item"><i class="ri-image-line"></i> Pictures</div>
                            <div class="sidebar-item"><i class="ri-music-line"></i> Music</div>
                        </div>
                        <div class="sidebar-section">
                            <div class="sidebar-title">DEVICES</div>
                            <div class="sidebar-item"><i class="ri-hard-drive-line"></i> Macintosh HD</div>
                        </div>
                    </div>
                    <div class="finder-main">
                        <div class="file-grid">
                            <div class="file-item"><i class="ri-file-pdf-line"></i><span>Resume.pdf</span></div>
                            <div class="file-item"><i class="ri-folder-line"></i><span>Photos</span></div>
                            <div class="file-item"><i class="ri-file-text-line"></i><span>Notes.txt</span></div>
                            <div class="file-item"><i class="ri-folder-line"></i><span>Projects</span></div>
                            <div class="file-item"><i class="ri-file-excel-line"></i><span>Budget.xlsx</span></div>
                            <div class="file-item"><i class="ri-folder-line"></i><span>Music</span></div>
                            <div class="file-item"><i class="ri-file-zip-line"></i><span>Archive.zip</span></div>
                            <div class="file-item"><i class="ri-image-line"></i><span>Photo.jpg</span></div>
                        </div>
                    </div>
                </div>
            `,
            
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
                    <div class="safari-toolbar">
                        <div class="nav-controls">
                            <button class="nav-btn"><i class="ri-arrow-left-line"></i></button>
                            <button class="nav-btn"><i class="ri-arrow-right-line"></i></button>
                        </div>
                        <div class="address-bar">
                            <input type="text" placeholder="Search or enter website name" value="">
                        </div>
                        <button class="reload-btn"><i class="ri-refresh-line"></i></button>
                    </div>
                    <div class="safari-main">
                        <div class="start-page">
                            <div class="start-logo"><i class="ri-safari-line"></i></div>
                            <div class="start-title">Safari</div>
                            <div class="start-subtitle">Welcome to Safari Web Browser</div>
                            <div class="bookmarks-grid">
                                <div class="bookmark-item"><i class="ri-apple-line"></i><span>Apple</span></div>
                                <div class="bookmark-item"><i class="ri-github-line"></i><span>GitHub</span></div>
                                <div class="bookmark-item"><i class="ri-google-line"></i><span>Google</span></div>
                                <div class="bookmark-item"><i class="ri-youtube-line"></i><span>YouTube</span></div>
                                <div class="bookmark-item"><i class="ri-twitter-line"></i><span>Twitter</span></div>
                                <div class="bookmark-item"><i class="ri-linkedin-line"></i><span>LinkedIn</span></div>
                            </div>
                        </div>
                    </div>
                </div>
            `,
            
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
                </div>
            `,
            
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
                        <div class="terminal-line">Last login: Fri Aug  1 21:00:00 on ttys000</div>
                        <div class="terminal-line"><span class="prompt">user@macOS-Web ~ %</span></div>
                    </div>
                    <div class="terminal-input-line">
                        <span class="prompt">user@macOS-Web ~ %</span>
                        <input type="text" class="terminal-input" id="terminal-input" autocomplete="off">
                    </div>
                </div>
            `
        };
        
        return appTemplates[appName] || '<div>App not found</div>';
    }

    /* ---------- App-specific functionality ----------------------- */
    function initAppFunctionality(appName, windowContainer) {
        if (appName === 'calculator') {
            initCalculator(windowContainer);
        } else if (appName === 'terminal') {
            initTerminal(windowContainer);
        }
    }

    // Calculator functionality
    let calcDisplay, calcOperator = null, calcPrevious = null, calcShouldReset = false;

    window.inputCalcNumber = function(num) {
        calcDisplay = calcDisplay || document.getElementById('calc-display');
        if (calcShouldReset) {
            calcDisplay.textContent = '0';
            calcShouldReset = false;
        }
        if (calcDisplay.textContent === '0') {
            calcDisplay.textContent = num;
        } else {
            calcDisplay.textContent += num;
        }
    };

    window.inputDecimal = function() {
        calcDisplay = calcDisplay || document.getElementById('calc-display');
        if (calcShouldReset) {
            calcDisplay.textContent = '0';
            calcShouldReset = false;
        }
        if (calcDisplay.textContent.indexOf('.') === -1) {
            calcDisplay.textContent += '.';
        }
    };

    window.setOperator = function(op) {
        calcDisplay = calcDisplay || document.getElementById('calc-display');
        if (calcOperator && !calcShouldReset) {
            calculate();
        }
        calcPrevious = calcDisplay.textContent;
        calcOperator = op;
        calcShouldReset = true;
    };

    window.calculate = function() {
        calcDisplay = calcDisplay || document.getElementById('calc-display');
        if (calcOperator && calcPrevious !== null) {
            const prev = parseFloat(calcPrevious);
            const current = parseFloat(calcDisplay.textContent);
            let result;

            switch (calcOperator) {
                case '+': result = prev + current; break;
                case '−': result = prev - current; break;
                case '×': result = prev * current; break;
                case '÷': result = current !== 0 ? prev / current : 0; break;
                default: return;
            }

            calcDisplay.textContent = result.toString();
            calcOperator = null;
            calcPrevious = null;
            calcShouldReset = true;
        }
    };

    window.clearCalc = function() {
        calcDisplay = calcDisplay || document.getElementById('calc-display');
        calcDisplay.textContent = '0';
        calcOperator = null;
        calcPrevious = null;
        calcShouldReset = false;
    };

    window.toggleSign = function() {
        calcDisplay = calcDisplay || document.getElementById('calc-display');
        if (calcDisplay.textContent !== '0') {
            calcDisplay.textContent = calcDisplay.textContent.charAt(0) === '-' 
                ? calcDisplay.textContent.slice(1) 
                : '-' + calcDisplay.textContent;
        }
    };

    window.percentage = function() {
        calcDisplay = calcDisplay || document.getElementById('calc-display');
        calcDisplay.textContent = (parseFloat(calcDisplay.textContent) / 100).toString();
    };

    function initCalculator(windowContainer) {
        calcDisplay = windowContainer.querySelector('#calc-display');
    }

    function initTerminal(windowContainer) {
        const input = windowContainer.querySelector('#terminal-input');
        const output = windowContainer.querySelector('#terminal-output');
        
        input.focus();
        
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                const command = this.value.trim();
                
                if (command) {
                    // Add command to output
                    const commandLine = document.createElement('div');
                    commandLine.className = 'terminal-line';
                    commandLine.innerHTML = `<span class="prompt">user@macOS-Web ~ %</span> ${command}`;
                    output.appendChild(commandLine);
                    
                    // Process command
                    let response = '';
                    if (command === 'ls') {
                        response = 'Applications  Documents  Downloads  Desktop  Library  Movies  Music  Pictures  Public';
                    } else if (command === 'pwd') {
                        response = '/Users/user';
                    } else if (command === 'date') {
                        response = new Date().toString();
                    } else if (command === 'whoami') {
                        response = 'user';
                    } else if (command.startsWith('echo ')) {
                        response = command.substring(5);
                    } else if (command === 'clear') {
                        output.innerHTML = '<div class="terminal-line"><span class="prompt">user@macOS-Web ~ %</span></div>';
                        this.value = '';
                        return;
                    } else if (command === 'help') {
                        response = 'Available commands: ls, pwd, date, whoami, echo [text], clear, help';
                    } else {
                        response = `zsh: command not found: ${command}`;
                    }
                    
                    if (response) {
                        const responseLine = document.createElement('div');
                        responseLine.className = 'terminal-line';
                        responseLine.textContent = response;
                        output.appendChild(responseLine);
                    }
                }
                
                // Add new prompt line
                const newPrompt = document.createElement('div');
                newPrompt.className = 'terminal-line';
                newPrompt.innerHTML = '<span class="prompt">user@macOS-Web ~ %</span>';
                output.appendChild(newPrompt);
                
                this.value = '';
                output.scrollTop = output.scrollHeight;
            }
        });
    }
});
