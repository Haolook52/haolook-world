(function () {
    'use strict';

    var currentPage = 'home';
    var lightboxImages = [];
    var lightboxIndex = 0;
    var heroSlides = [];
    var currentHeroSlide = 0;
    var heroInterval = null;

    document.addEventListener('DOMContentLoaded', function () {
        initNavigation();
        initCanvasBackground();
        initCursorGlow();
        initHeroSlideshow();
        initMobileMenu();
        initLightbox();
        initStatCounter();
        handleNavigation();
        loadContent();
    });

    function initNavigation() {
        var navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(function (link) {
            link.addEventListener('click', function (e) {
                var page = this.getAttribute('data-page');
                if (page) {
                    e.preventDefault();
                    navigateTo(page);
                }
            });
        });

        var dropdownLinks = document.querySelectorAll('.dropdown-menu a');
        dropdownLinks.forEach(function (link) {
            link.addEventListener('click', function (e) {
                e.preventDefault();
                var seriesName = this.getAttribute('data-series');
                navigateTo('series');
                setTimeout(function () {
                    var tabs = document.querySelectorAll('.series-tab');
                    tabs.forEach(function (tab) {
                        if (tab.getAttribute('data-series') === seriesName) {
                            tab.click();
                        }
                    });
                }, 300);
            });
        });

        var navLogo = document.querySelector('.nav-logo');
        if (navLogo) {
            navLogo.addEventListener('click', function (e) {
                e.preventDefault();
                navigateTo('home');
            });
        }

        window.addEventListener('scroll', function () {
            var navbar = document.getElementById('navbar');
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });
    }

    function navigateTo(page) {
        currentPage = page;

        document.querySelectorAll('.nav-link').forEach(function (link) {
            link.classList.remove('active');
            if (link.getAttribute('data-page') === page) {
                link.classList.add('active');
            }
        });

        document.querySelectorAll('.page-section').forEach(function (section) {
            section.classList.remove('active');
        });
        var targetSection = document.getElementById('page-' + page);
        if (targetSection) {
            targetSection.classList.add('active');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        closeMobileMenu();
    }

    function handleNavigation() {
        document.querySelectorAll('[data-page]').forEach(function (el) {
            el.addEventListener('click', function (e) {
                var page = this.getAttribute('data-page');
                if (page && !this.getAttribute('data-series')) {
                    e.preventDefault();
                    navigateTo(page);
                }
            });
        });
    }

    function initMobileMenu() {
        var toggle = document.getElementById('nav-toggle');
        var menu = document.getElementById('nav-menu');

        if (toggle && menu) {
            toggle.addEventListener('click', function () {
                toggle.classList.toggle('active');
                menu.classList.toggle('active');
            });
        }

        var dropdownToggle = document.querySelector('.dropdown-toggle');
        var dropdownMenu = document.querySelector('.dropdown-menu');
        if (dropdownToggle && dropdownMenu) {
            dropdownToggle.addEventListener('click', function (e) {
                if (window.innerWidth <= 1024) {
                    e.preventDefault();
                    dropdownMenu.classList.toggle('open');
                }
            });
        }

        document.addEventListener('click', function (e) {
            if (!e.target.closest('.dropdown')) {
                if (dropdownMenu && window.innerWidth <= 1024) {
                    dropdownMenu.classList.remove('open');
                }
            }
        });
    }

    function closeMobileMenu() {
        var toggle = document.getElementById('nav-toggle');
        var menu = document.getElementById('nav-menu');
        if (toggle && menu) {
            toggle.classList.remove('active');
            menu.classList.remove('active');
        }
    }

    function initCanvasBackground() {
        var canvas = document.getElementById('bg-canvas');
        if (!canvas) return;
        var ctx = canvas.getContext('2d');
        var particles = [];
        var particleCount = 50;

        function resize() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }

        resize();
        window.addEventListener('resize', resize);

        function Particle() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.vx = (Math.random() - 0.5) * 0.3;
            this.vy = (Math.random() - 0.5) * 0.3;
            this.size = Math.random() * 1.5 + 0.5;
            this.opacity = Math.random() * 0.5 + 0.1;
        }

        for (var i = 0; i < particleCount; i++) {
            particles.push(new Particle());
        }

        function animate() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            particles.forEach(function (p) {
                p.x += p.vx;
                p.y += p.vy;

                if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
                if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(232, 192, 125, ' + p.opacity + ')';
                ctx.fill();
            });

            particles.forEach(function (p1, i) {
                particles.forEach(function (p2, j) {
                    if (i < j) {
                        var dx = p1.x - p2.x;
                        var dy = p1.y - p2.y;
                        var dist = Math.sqrt(dx * dx + dy * dy);
                        if (dist < 150) {
                            ctx.beginPath();
                            ctx.moveTo(p1.x, p1.y);
                            ctx.lineTo(p2.x, p2.y);
                            ctx.strokeStyle = 'rgba(232, 192, 125, ' + (0.05 * (1 - dist / 150)) + ')';
                            ctx.lineWidth = 0.5;
                            ctx.stroke();
                        }
                    }
                });
            });

            requestAnimationFrame(animate);
        }

        animate();
    }

    function initCursorGlow() {
        var glow = document.getElementById('cursor-glow');
        if (!glow) return;

        document.addEventListener('mousemove', function (e) {
            glow.style.left = e.clientX + 'px';
            glow.style.top = e.clientY + 'px';
        });
    }

    function initHeroSlideshow() {
        var slideshow = document.getElementById('hero-slideshow');
        if (!slideshow) return;

        function renderPlaceholder() {
            slideshow.innerHTML = '';
            var placeholder = document.createElement('div');
            placeholder.className = 'hero-slide active placeholder';
            slideshow.appendChild(placeholder);
        }

        renderPlaceholder();

        fetchAndRenderHero();
    }

    function fetchAndRenderHero() {
        ImageLoader.loadAllSeries()
            .then(function () { return ImageLoader.loadTravelImages(); })
            .then(function () {
                heroSlides = ImageLoader.getHeroSlides();
                if (heroSlides.length > 0) {
                    renderHeroSlides();
                    startHeroAutoplay();
                }
            });
    }

    function renderHeroSlides() {
        var slideshow = document.getElementById('hero-slideshow');
        slideshow.innerHTML = '';

        heroSlides.forEach(function (src, i) {
            var slide = document.createElement('div');
            slide.className = 'hero-slide';
            slide.style.backgroundImage = 'url("' + src + '")';
            if (i === 0) slide.classList.add('active');
            slideshow.appendChild(slide);
        });
    }

    function startHeroAutoplay() {
        if (heroInterval) clearInterval(heroInterval);
        heroInterval = setInterval(function () {
            if (heroSlides.length < 2) return;
            var slides = document.querySelectorAll('.hero-slide');
            if (slides.length < 2) return;
            slides[currentHeroSlide].classList.remove('active');
            currentHeroSlide = (currentHeroSlide + 1) % slides.length;
            slides[currentHeroSlide].classList.add('active');
        }, 5000);
    }

    function initLightbox() {
        var lightbox = document.getElementById('lightbox');
        var closeBtn = document.getElementById('lightbox-close');
        var prevBtn = document.getElementById('lightbox-prev');
        var nextBtn = document.getElementById('lightbox-next');

        if (!lightbox) return;

        closeBtn.addEventListener('click', closeLightbox);
        prevBtn.addEventListener('click', function () {
            showLightboxImage(lightboxIndex - 1);
        });
        nextBtn.addEventListener('click', function () {
            showLightboxImage(lightboxIndex + 1);
        });

        document.addEventListener('keydown', function (e) {
            if (!lightbox.classList.contains('active')) return;
            if (e.key === 'Escape') closeLightbox();
            if (e.key === 'ArrowLeft') showLightboxImage(lightboxIndex - 1);
            if (e.key === 'ArrowRight') showLightboxImage(lightboxIndex + 1);
        });

        lightbox.addEventListener('click', function (e) {
            if (e.target === lightbox) closeLightbox();
        });
    }

    function openLightbox(images, index) {
        lightboxImages = images;
        lightboxIndex = index;
        showLightboxImage(index);
        document.getElementById('lightbox').classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeLightbox() {
        document.getElementById('lightbox').classList.remove('active');
        document.body.style.overflow = '';
    }

    function showLightboxImage(index) {
        if (lightboxImages.length === 0) return;
        lightboxIndex = (index + lightboxImages.length) % lightboxImages.length;

        var img = document.getElementById('lightbox-img');
        img.src = lightboxImages[lightboxIndex];

        var caption = document.getElementById('lightbox-title');
        caption.textContent = '照片 ' + (lightboxIndex + 1);

        var counter = document.getElementById('lightbox-counter');
        counter.textContent = (lightboxIndex + 1) + ' / ' + lightboxImages.length;
    }

    function initStatCounter() {
        var stats = document.querySelectorAll('.stat-number');
        if (stats.length === 0) return;

        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    var el = entry.target;
                    var target = parseInt(el.getAttribute('data-count'));
                    animateCounter(el, target);
                    observer.unobserve(el);
                }
            });
        }, { threshold: 0.5 });

        stats.forEach(function (stat) { observer.observe(stat); });
    }

    function animateCounter(el, target) {
        var current = 0;
        var increment = target / 60;
        var timer = setInterval(function () {
            current += increment;
            if (current >= target) {
                el.textContent = target;
                clearInterval(timer);
            } else {
                el.textContent = Math.floor(current);
            }
        }, 20);
    }

    function loadContent() {
        loadFeatured();
        loadSeries();
        loadTravel();
        initCopyButton();
    }

    function loadFeatured() {
        var grid = document.getElementById('featured-grid');
        if (!grid) return;

        function renderPlaceholder() {
            grid.innerHTML = '';
            for (var i = 1; i <= 6; i++) {
                var item = document.createElement('div');
                item.className = 'featured-item placeholder';
                item.innerHTML = '<div class="featured-overlay"><div class="featured-cat">PHOTOGRAPHY</div><div class="featured-title">即将加载</div></div>';
                grid.appendChild(item);
            }
        }

        renderPlaceholder();

        ImageLoader.loadAllSeries()
            .then(function () { return ImageLoader.loadTravelImages(); })
            .then(function () {
                var featured = ImageLoader.getFeaturedImages();
                if (featured.length > 0) {
                    renderFeatured(featured);
                }
            });
    }

    function renderFeatured(images) {
        var grid = document.getElementById('featured-grid');
        grid.innerHTML = '';

        images.forEach(function (src, i) {
            var item = document.createElement('div');
            item.className = 'featured-item';
            item.innerHTML =
                '<img class="featured-img" src="' + src + '" alt="Featured ' + (i + 1) + '" loading="lazy">' +
                '<div class="featured-overlay">' +
                '<div class="featured-cat">PHOTOGRAPHY</div>' +
                '<div class="featured-title">精选作品 #' + (i + 1) + '</div>' +
                '</div>';

            item.addEventListener('click', function () {
                openLightbox(images, i);
            });

            grid.appendChild(item);
        });
    }

    function loadSeries() {
        ImageLoader.loadAllSeries().then(function (seriesList) {
            renderSeriesTabs(seriesList);
            renderSeriesGallery(seriesList, 'all');
        });
    }

    function renderSeriesTabs(seriesList) {
        var tabsContainer = document.getElementById('series-tabs');
        var dropdownMenu = document.getElementById('series-dropdown');
        if (!tabsContainer) return;

        tabsContainer.innerHTML = '';
        dropdownMenu.innerHTML = '';

        var allTab = document.createElement('button');
        allTab.className = 'series-tab active';
        allTab.setAttribute('data-series', 'all');
        allTab.textContent = '全部系列';
        tabsContainer.appendChild(allTab);

        allTab.addEventListener('click', function () {
            updateSeriesTabs('all');
            renderSeriesGallery(seriesList, 'all');
        });

        seriesList.forEach(function (series) {
            var tab = document.createElement('button');
            tab.className = 'series-tab';
            tab.setAttribute('data-series', series.name);
            tab.textContent = series.name;
            tabsContainer.appendChild(tab);

            tab.addEventListener('click', function () {
                updateSeriesTabs(series.name);
                renderSeriesGallery(seriesList, series.name);
            });

            var menuItem = document.createElement('li');
            var menuLink = document.createElement('a');
            menuLink.setAttribute('href', '#');
            menuLink.setAttribute('data-series', series.name);
            menuLink.textContent = series.name + ' (' + series.images.length + ')';
            menuItem.appendChild(menuLink);
            dropdownMenu.appendChild(menuItem);
        });
    }

    function updateSeriesTabs(activeName) {
        document.querySelectorAll('.series-tab').forEach(function (tab) {
            tab.classList.remove('active');
            if (tab.getAttribute('data-series') === activeName) {
                tab.classList.add('active');
            }
        });
    }

    function renderSeriesGallery(seriesList, filterName) {
        var gallery = document.getElementById('series-gallery');
        if (!gallery) return;
        gallery.innerHTML = '';

        var allImages = [];

        if (filterName === 'all') {
            seriesList.forEach(function (series) {
                series.images.forEach(function (img) {
                    allImages.push({ src: img, series: series.name });
                });
            });
        } else {
            var found = seriesList.find(function (s) { return s.name === filterName; });
            if (found) {
                found.images.forEach(function (img) {
                    allImages.push({ src: img, series: found.name });
                });
            }
        }

        if (allImages.length === 0) {
            gallery.innerHTML = '<div class="empty-state"><i class="fa-solid fa-images"></i>暂无图片，请将照片放入 photos/系列作品 文件夹</div>';
            return;
        }

        var allImageSrcs = allImages.map(function (item) { return item.src; });

        allImages.forEach(function (item, i) {
            var el = document.createElement('div');
            el.className = 'gallery-item';
            el.style.animationDelay = (i * 0.03) + 's';
            el.innerHTML =
                '<img src="' + item.src + '" alt="' + item.series + '" loading="lazy">' +
                '<div class="gallery-caption">' +
                '<div class="caption-title">' + item.series + ' #' + (i + 1) + '</div>' +
                '<div class="caption-series">SERIES</div>' +
                '</div>';

            el.addEventListener('click', function () {
                openLightbox(allImageSrcs, i);
            });

            gallery.appendChild(el);
        });
    }

    function loadTravel() {
        var gallery = document.getElementById('travel-gallery');
        if (!gallery) return;

        ImageLoader.loadTravelImages().then(function (images) {
            if (images.length === 0) {
                gallery.innerHTML = '<div class="empty-state"><i class="fa-solid fa-mountain-sun"></i>暂无图片，请将照片放入 photos/旅行风光 文件夹</div>';
                return;
            }

            images.forEach(function (src, i) {
                var el = document.createElement('div');
                el.className = 'gallery-item';
                el.style.animationDelay = (i * 0.03) + 's';
                el.innerHTML =
                    '<img src="' + src + '" alt="Travel ' + (i + 1) + '" loading="lazy">' +
                    '<div class="gallery-caption">' +
                    '<div class="caption-title">旅行风光 #' + (i + 1) + '</div>' +
                    '<div class="caption-series">TRAVEL</div>' +
                    '</div>';

                el.addEventListener('click', function () {
                    openLightbox(images, i);
                });

                gallery.appendChild(el);
            });
        });
    }

    function initCopyButton() {
        var btn = document.getElementById('btn-copy-wechat');
        if (!btn) return;

        btn.addEventListener('click', function () {
            var wechatId = document.getElementById('wechat-id').textContent;

            if (navigator.clipboard) {
                navigator.clipboard.writeText(wechatId).then(function () {
                    showCopySuccess();
                }).catch(function () {
                    fallbackCopy(wechatId);
                });
            } else {
                fallbackCopy(wechatId);
            }
        });
    }

    function fallbackCopy(text) {
        var ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        try {
            document.execCommand('copy');
            showCopySuccess();
        } catch (e) {}
        document.body.removeChild(ta);
    }

    function showCopySuccess() {
        var btn = document.getElementById('btn-copy-wechat');
        var originalText = btn.textContent;
        btn.textContent = '已复制!';
        btn.classList.add('copied');
        setTimeout(function () {
            btn.textContent = originalText;
            btn.classList.remove('copied');
        }, 2000);
    }
})();
