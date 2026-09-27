const envSlidesSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">
    <rect width="100%" height="100%" fill="#722F37"/>
    <path d="M 20 60 L 200 170 L 380 60 Z" fill="#AA3C46" stroke="#D4AF37" stroke-width="1.5" opacity="0.9"/>
    <rect x="20" y="60" width="360" height="180" rx="4" fill="none" stroke="#D4AF37" stroke-width="1.5" opacity="0.8"/>
    <circle cx="200" cy="140" r="28" fill="#D4AF37" stroke="#ffffff" stroke-width="1" opacity="0.95"/>
    <text x="200" y="145" dominant-baseline="middle" text-anchor="middle" font-family="'Playfair Display', serif" font-size="12" font-weight="bold" fill="#722F37">OPEN</text>
    <text x="50%" y="270" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="11" letter-spacing="3" fill="#FDFBF7" opacity="0.85">ENVELOPE SLIDES</text>
</svg>`;
const envSlidesThumb = 'data:image/svg+xml;base64,' + btoa(envSlidesSvg);

window.registerTemplate({
    id: 'interactive-envelope-slides',
    name: 'Interactive Envelope & Slides',
    thumb: envSlidesThumb,
    freeform: false,
    scrollable: false, // Explicitly non-scrolling
    defaults: {
        colors: {
            primary: '#D4AF37',     // Gold
            bg: '#722F37',          // Royal Burgundy
            text: '#FDFBF7'         // Ivory
        },
        fonts: {
            heading: "'Playfair Display', serif"
        }
    },
    render: function(d, isEditMode) {
        const colors = {
            primary: d?.design?.colors?.primary || this.defaults.colors.primary,
            bg: d?.design?.colors?.bg || this.defaults.colors.bg,
            text: d?.design?.colors?.text || this.defaults.colors.text
        };
        const set = d?.settings || {};
        const showRsvp = set.showRsvp === true; // Active only when enabled
        const showPhotos = set.showPhotos === true; // Get Photos feature

        // Safe HTML escaping helper
        const escape = (val, fallback = '') => String(val ?? fallback)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');

        // Edit wrapper helper for Studio
        const edit = (key, contentHtml, visibilityKey) => {
            if (visibilityKey && set[visibilityKey] === false) {
                return isEditMode ? `<div class="env-hidden" data-edit="${key}">${contentHtml}</div>` : '';
            }
            return isEditMode
                ? `<div class="env-editable" data-edit="${key}">
                     <span class="env-edit-pen" title="Edit this section"><i class="fa-solid fa-pen"></i></span>
                     ${contentHtml}
                   </div>`
                : contentHtml;
        };

        const bismillahText = escape(d?.content?.bismillah, 'بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ');
        const headingText = escape(d?.content?.heading, 'Wedding Invitation');
        const groomName = escape(d?.couple?.groom, 'Groom Name');
        const brideName = escape(d?.couple?.bride, 'Bride Name');
        const groomPhoto = d?.couple?.groomPhoto;
        const bridePhoto = d?.couple?.bridePhoto;
        
        const defaultInitials = `${groomName.charAt(0)}${brideName.charAt(0)}`.toUpperCase();
        const displayInitials = d?.couple?.customInitials ? escape(d.couple.customInitials) : defaultInitials;

        const invitationMsg = escape(d?.content?.message, 'In the name of Allah, we invite you to celebrate our Nikah.');
        const arabicQuote = escape(d?.content?.arabicText, 'وَمِنْ آيَاتِهِ أَنْ خَلَقَ لَكُم مِّنْ أَنفُسِكُمْ أَزْوَاجًا');
        const translationQuote = escape(d?.content?.translation, '"That you may find rest in them, and He put between you love."');
        const eventTitle = escape(d?.mainEvent?.title, 'Nikah Ceremony');
        
        const dateParts = /^\d{4}-\d{2}-\d{2}$/.test(d?.mainEvent?.date || '') ? d.mainEvent.date.split('-').map(Number) : null;
        const selectedDate = dateParts ? new Date(dateParts[0], dateParts[1] - 1, dateParts[2]) : null;
        const eventDate = selectedDate ? new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(selectedDate) : 'Wedding Date';
        const monthLabel = selectedDate ? new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(selectedDate) : 'Wedding Month';

        const formatTime = (t) => window.formatTimeTo12Hour ? window.formatTimeTo12Hour(t) : t;
        const eventTime = formatTime(escape(d?.mainEvent?.time, '11:00 AM'));
        const endTime = d?.mainEvent?.endTime ? formatTime(escape(d.mainEvent.endTime)) : '';
        const displayTime = endTime ? `${eventTime} - ${endTime}` : eventTime;

        const eventVenue = escape(d?.mainEvent?.venue, 'Grand Imperial Banquet');
        const eventAddress = escape(d?.mainEvent?.address, 'Kochi, Kerala');
        const mapUrl = d?.mainEvent?.mapUrl;
        const isValidMapUrl = typeof mapUrl === 'string' && /^https?:\/\//i.test(mapUrl.trim());
        const safeMapUrl = isValidMapUrl ? escape(mapUrl.trim()) : '';

        // Open Envelope
        if (!window.toggleEnvelope) {
            window.toggleEnvelope = function(btn) {
                const root = btn.closest('.env-template-root');
                const wrapper = root.querySelector('.env-envelope-wrapper');
                if (wrapper) {
                    wrapper.classList.add('env-opened');
                }
            };
        }

        // Swipe & Slide Navigator
        if (!window.initEnvSwipe) {
            window.initEnvSwipe = function(el) {
                let startX = 0;
                let startY = 0;
                el.addEventListener('touchstart', (e) => {
                    startX = e.touches[0].clientX;
                    startY = e.touches[0].clientY;
                }, { passive: true });
                el.addEventListener('touchend', (e) => {
                    let endX = e.changedTouches[0].clientX;
                    let endY = e.changedTouches[0].clientY;
                    let diffX = startX - endX;
                    let diffY = startY - endY;
                    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 40) {
                        if (diffX > 0) {
                            window.changeEnvSlide(el, 1);
                        } else {
                            window.changeEnvSlide(el, -1);
                        }
                    }
                }, { passive: true });
            };

            window.changeEnvSlide = function(btnOrContainer, direction) {
                const root = btnOrContainer.closest('.env-template-root');
                const track = root.querySelector('.env-slides-track');
                const slides = root.querySelectorAll('.env-slide');
                if (slides.length <= 1) return;
                
                let activeIndex = Number(track.dataset.activeIndex || 0);
                let nextIndex = activeIndex + direction;
                
                // Tactile boundary bounce
                if (nextIndex < 0) {
                    track.style.transform = 'translateX(20px)';
                    setTimeout(() => {
                        track.style.transform = 'translateX(0%)';
                    }, 140);
                    return;
                }
                
                if (nextIndex >= slides.length) {
                    track.style.transform = `translateX(calc(-${activeIndex * 100}% - 20px))`;
                    setTimeout(() => {
                        track.style.transform = `translateX(-${activeIndex * 100}%)`;
                    }, 140);
                    return;
                }
                
                track.dataset.activeIndex = nextIndex;
                track.style.transform = `translateX(-${nextIndex * 100}%)`;
                
                // Update indicator
                const indicator = root.querySelector('.env-slide-indicator');
                if (indicator) indicator.innerText = `Slide ${nextIndex + 1} of ${slides.length}`;
            };
        }

        // Calendar View
        const calendar = (() => {
            if (!selectedDate) return '<div class="env-calendar-empty text-xs opacity-50">Date not set</div>';
            const year = selectedDate.getFullYear(), month = selectedDate.getMonth(), selectedDay = selectedDate.getDate();
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            const firstDay = (new Date(year, month, 1).getDay() + 6) % 7;
            const cells = Array.from({ length: firstDay }, () => '<span></span>');
            for (let day = 1; day <= daysInMonth; day++) {
                cells.push(`<span class="${day === selectedDay ? 'env-selected-day' : ''}">${day}${day === selectedDay ? '<b>♥</b>' : ''}</span>`);
            }
            return `<div class="env-calendar-week">${['M', 'T', 'W', 'T', 'F', 'S', 'S'].map(day => `<span>${day}</span>`).join('')}</div><div class="env-calendar-grid">${cells.join('')}</div>`;
        })();

        // Portraits layout
        let portraitsHtml = '';
        if (groomPhoto || bridePhoto) {
            portraitsHtml = `<div class="flex items-center justify-center gap-3 my-1 w-full shrink-0">`;
            if (groomPhoto) {
                portraitsHtml += `<div class="relative w-11 h-11 rounded-full p-0.5 shrink-0 aspect-square" style="border: 1.5px solid ${colors.primary};">
                                     <img src="${groomPhoto}" class="w-full h-full object-cover rounded-full aspect-square" />
                                 </div>`;
            }
            if (groomPhoto && bridePhoto) {
                portraitsHtml += `<span class="text-xs font-serif italic opacity-60" style="color: ${colors.primary};">&amp;</span>`;
            }
            if (bridePhoto) {
                portraitsHtml += `<div class="relative w-11 h-11 rounded-full p-0.5 shrink-0 aspect-square" style="border: 1.5px solid ${colors.primary};">
                                     <img src="${bridePhoto}" class="w-full h-full object-cover rounded-full aspect-square" />
                                 </div>`;
            }
            portraitsHtml += `</div>`;
        }

        // Map button
        const mapBtnHtml = (set.showMap !== false && isValidMapUrl && !isEditMode) ? `
            <a href="${safeMapUrl}" target="_blank" rel="noopener noreferrer" class="env-gold-btn inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] uppercase tracking-wider no-underline transition active:scale-95">
                <i class="fa-solid fa-location-dot"></i> Maps
            </a>
        ` : (isEditMode ? `<span class="env-gold-btn inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] uppercase tracking-wider opacity-70 cursor-not-allowed"><i class="fa-solid fa-location-dot"></i> Map</span>` : '');

        const reminderBtnHtml = isEditMode
            ? `<span class="env-gold-btn inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] uppercase tracking-wider opacity-70 cursor-not-allowed"><i class="fa-regular fa-bell"></i> Remind</span>`
            : `<button type="button" class="env-gold-btn inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] uppercase tracking-wider transition active:scale-95" onclick="addWeddingReminder(this)" data-title="${escape(encodeURIComponent(`${eventTitle} — ${groomName} & ${brideName}`))}" data-location="${escape(encodeURIComponent(`${eventVenue}, ${eventAddress}`))}" data-date="${d?.mainEvent?.date || ''}" data-time="${escape(eventTime)}"><i class="fa-regular fa-bell"></i> Remind</button>`;

        // RSVP Form (Inside Slide 3 if active)
        const rsvpHtml = (showRsvp && !isEditMode) ? `
            <div class="w-full max-w-[280px] p-1 text-center my-0.5 mx-auto shrink-0" style="color: #1F2937;">
                <h4 class="text-[11px] font-bold mb-1" style="color: ${colors.primary}">Will You Attend?</h4>
                ${window.renderPublicRsvpForm ? window.renderPublicRsvpForm(colors, isEditMode, false) : ''}
            </div>
        ` : (isEditMode && showRsvp ? `<div class="w-full max-w-[260px] p-3 text-center border border-dashed text-[9px] opacity-70" style="border-color: ${colors.primary}60; color: #1F2937;">RSVP Form Area</div>` : '');

        let totalSlidesCount = 2;
        if (showRsvp) totalSlidesCount++;
        if (showPhotos) totalSlidesCount++;

        const styles = `
            <style>
                .env-template-root {
                    background-color: ${colors.bg};
                    color: ${colors.text};
                    font-family: 'Poppins', sans-serif;
                    height: 100%;
                    min-height: 100dvh;
                    width: 100%;
                    max-width: 480px;
                    margin: 0 auto;
                    position: relative;
                    overflow: hidden;
                    box-sizing: border-box;
                }
                
                /* Envelope View container */
                .env-envelope-wrapper {
                    position: absolute;
                    inset: 0;
                    z-index: 40;
                    transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.5s ease;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: ${colors.bg};
                }
                .env-opened {
                    transform: translateY(102%) scale(0.96);
                    opacity: 0;
                    pointer-events: none;
                }

                .env-envelope-inner {
                    position: relative;
                    width: 85%;
                    max-width: 300px;
                    aspect-ratio: 4/3;
                    border: 2px solid ${colors.primary};
                    border-radius: 12px;
                    background: rgba(255, 255, 255, 0.03);
                    box-shadow: 0 15px 30px rgba(0,0,0,0.3);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 20px;
                    text-align: center;
                }

                .env-wax-seal {
                    position: absolute;
                    bottom: -22px;
                    cursor: pointer;
                    width: 50px;
                    height: 50px;
                    background: radial-gradient(circle, #f39c12 0%, ${colors.primary} 70%, #996515 100%);
                    border: 2px solid #ffffff;
                    border-radius: 50%;
                    box-shadow: 0 6px 12px rgba(0,0,0,0.4);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 9px;
                    font-weight: 800;
                    color: ${colors.bg};
                    animation: envBounce 2s infinite ease-in-out;
                    z-index: 45;
                }
                @keyframes envBounce {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-4px) scale(1.03); }
                }

                /* Content viewport wrapper with hidden horizontal overflow */
                .env-card-slides-wrapper {
                    position: absolute;
                    inset: 12px;
                    z-index: 10;
                    overflow: hidden;
                    box-sizing: border-box;
                    padding-bottom: 44px;
                }

                /* Spring Horizontal Carousel Track */
                .env-slides-track {
                    display: flex;
                    width: 100%;
                    height: 100%;
                    transition: transform 0.65s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    will-change: transform;
                }

                .env-slide {
                    flex: 0 0 100%;
                    width: 100%;
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 0 6px;
                    box-sizing: border-box;
                    overflow: hidden;
                }

                /* Glassmorphic White Backdrop Card with legible dark text */
                .env-slide-card {
                    background: rgba(255, 255, 255, 0.88);
                    -webkit-backdrop-filter: blur(14px);
                    backdrop-filter: blur(14px);
                    border: 1.5px solid rgba(255, 255, 255, 0.6);
                    border-radius: 28px;
                    padding: 22px 16px;
                    width: 100%;
                    max-width: 320px;
                    max-height: 80vh;
                    overflow-y: auto;
                    box-shadow: 0 12px 36px rgba(0, 0, 0, 0.12);
                    box-sizing: border-box;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    margin: auto;
                    color: #1F2937 !important;
                }

                /* Force child elements to inherit regular dark color for high contrast on soft white backdrop */
                .env-slide-card p, .env-slide-card div:not(.env-arabic-text) {
                    color: #1F2937;
                }

                /* Editable elements */
                .env-editable {
                    position: relative;
                    cursor: pointer;
                    border-radius: 4px;
                    transition: all 0.2s;
                }
                .env-editable:hover {
                    outline: 1.5px dashed ${colors.primary};
                    background: rgba(255, 255, 255, 0.05);
                }
                .env-edit-pen {
                    position: absolute;
                    top: -6px;
                    right: -6px;
                    width: 16px;
                    height: 16px;
                    background: ${colors.primary};
                    color: ${colors.bg};
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 7px;
                    z-index: 50;
                }
                .env-hidden {
                    opacity: 0.25;
                    filter: grayscale(90%);
                }

                /* Sticky bottom pager panel */
                .env-pager-panel {
                    position: absolute;
                    bottom: 8px;
                    left: 12px;
                    right: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    z-index: 30;
                    border-top: 1px solid rgba(255,255,255,0.15);
                    padding-top: 6px;
                }
                .env-pager-btn {
                    width: 28px;
                    height: 28px;
                    color: ${colors.primary};
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    font-size: 11px;
                    transition: transform 0.2s;
                }
                .env-pager-btn:active {
                    transform: scale(0.85);
                }

                .env-gold-btn {
                    background: ${colors.primary};
                    color: ${colors.bg};
                    font-weight: 700;
                    border: none;
                    border-radius: 9999px;
                    font-size: 9px;
                }
                .env-gold-btn:hover {
                    opacity: 0.95;
                }

                .env-calendar-week { display: grid; grid-template-columns: repeat(7, 1fr); font-size: 7.5px; color: rgba(0,0,0,0.5); width: 100%; max-width: 160px; margin-bottom: 2px; }
                .env-calendar-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 3px 2px; font-size: 8.5px; width: 100%; max-width: 160px; color: #1F2937; }
                .env-calendar-grid span { position: relative; display: grid; place-items: center; min-height: 14px; }
                .env-selected-day { background: rgba(212,175,55,0.25); border-radius: 50%; font-weight: 700; border: 1px solid ${colors.primary}; color: ${colors.primary} !important; }
            </style>
        `;

        return `
            ${styles}
            <div class="env-template-root flex flex-col justify-between">
                
                <!-- ENVELOPE VIEW (Clicking Wax Seal slides it down and reveals invite) -->
                ${!isEditMode ? `
                <div class="env-envelope-wrapper">
                    <div class="env-envelope-inner">
                        <div class="font-serif text-[11px] uppercase tracking-[0.3em] opacity-80 mb-2" style="color: ${colors.primary}">You Are Invited</div>
                        <h2 class="font-serif text-2xl font-black italic tracking-wide" style="color: ${colors.primary}">${groomName}</h2>
                        <div class="text-sm opacity-60 my-1">&amp;</div>
                        <h2 class="font-serif text-2xl font-black italic tracking-wide" style="color: ${colors.primary}">${brideName}</h2>
                        <div class="env-wax-seal" onclick="window.toggleEnvelope(this)">OPEN</div>
                    </div>
                </div>
                ` : ''}

                <!-- CAROUSEL WRAPPER -->
                <div class="env-card-slides-wrapper" onpointerdown="if(!this.dataset.swipeInit){window.initEnvSwipe(this); this.dataset.swipeInit=true;}">
                    <div class="env-slides-track" data-active-index="0" style="transform: translateX(0%);">
                        
                        <!-- SLIDE 1: WELCOME & COUPLE -->
                        <div class="env-slide">
                            <div class="env-slide-card space-y-2.5">
                                ${edit('bismillah', `<div class="env-arabic-text font-arabic text-base tracking-normal text-center" style="color: ${colors.primary}">${bismillahText}</div>`, 'showBismillah')}
                                
                                ${edit('heading', `<div class="text-[8px] tracking-[0.3em] font-bold opacity-80 uppercase text-center" style="color: ${colors.primary}">${headingText}</div>`, 'showHeading')}
                                
                                ${edit('couple', `
                                    <div class="w-full flex flex-col items-center">
                                        <div class="font-serif text-lg tracking-wider uppercase font-bold text-center" style="color: ${colors.primary} !important;">${groomName}</div>
                                        <span class="text-[9px] opacity-40 font-serif italic my-0.5">&amp;</span>
                                        <div class="font-serif text-lg tracking-wider uppercase font-bold text-center" style="color: ${colors.primary} !important;">${brideName}</div>
                                        ${portraitsHtml}
                                    </div>
                                `, 'showCouple')}

                                ${edit('message', `<div class="text-[9.5px] leading-relaxed opacity-75 px-4 font-light max-w-[270px] text-center">"${invitationMsg}"</div>`, 'showMessage')}
                                
                                ${edit('quran', `
                                    <div class="px-2.5 py-1.5 rounded-xl max-w-[260px] mx-auto scale-90 border text-center" style="background: rgba(255,255,255,0.4); border-color: ${colors.primary}15;">
                                        <div class="env-arabic-text font-arabic text-sm leading-normal" style="color: ${colors.primary}">${arabicQuote}</div>
                                        <div class="text-[7.5px] opacity-60 leading-normal italic mt-0.5">“${translationQuote}”</div>
                                    </div>
                                `, 'showQuote')}
                                
                                <div class="text-[8px] opacity-40 tracking-widest animate-pulse mt-1 text-center"><i class="fa-solid fa-arrows-left-right text-[9px] mr-1"></i>Swipe to explore</div>
                            </div>
                        </div>

                        <!-- SLIDE 2: DETAILS & CALENDAR -->
                        <div class="env-slide">
                            <div class="env-slide-card space-y-3">
                                ${edit('mainEvent', `
                                    <div class="w-full text-center flex flex-col items-center">
                                        <span class="text-[8px] tracking-[0.25em] font-bold opacity-50 uppercase mb-0.5" style="color: ${colors.primary}">NIKAH CELEBRATION</span>
                                        <h3 class="font-serif text-xs font-bold uppercase tracking-wider mb-1" style="color: ${colors.primary}">${eventTitle}</h3>
                                        
                                        <div class="space-y-0.5 text-[9.5px] opacity-85 leading-normal text-center">
                                            <p class="font-bold"><i class="fa-regular fa-calendar-star mr-1" style="color: ${colors.primary}"></i>${eventDate}</p>
                                            <p><i class="fa-regular fa-clock mr-1" style="color: ${colors.primary}"></i>${displayTime}</p>
                                            <p class="font-medium mt-0.5"><i class="fa-solid fa-hotel mr-1" style="color: ${colors.primary}"></i>${eventVenue}</p>
                                            <p class="text-[8px] opacity-60 font-light">${eventAddress}</p>
                                        </div>
                                        
                                        <div class="flex justify-center items-center gap-1.5 mt-1.5">
                                            ${mapBtnHtml}
                                            ${reminderBtnHtml}
                                        </div>
                                    </div>
                                `, 'showEvent')}

                                ${edit('mainEvent', `
                                    <div class="flex flex-col items-center scale-[0.82] origin-top">
                                        <div class="text-[8.5px] tracking-wider uppercase opacity-60 mb-0.5" style="color: ${colors.primary}">${monthLabel}</div>
                                        ${calendar}
                                    </div>
                                `, 'showEvent')}

                                ${set.showCountdown ? edit('mainEvent', window.renderCountdownHtml ? window.renderCountdownHtml(d, colors, 'scale-[0.68] origin-top my-0.5') : '', 'showCountdown') : ''}
                            </div>
                        </div>

                        <!-- SLIDE 3: RSVP (Only visible if active) -->
                        ${showRsvp ? `
                        <div class="env-slide">
                            <div class="env-slide-card">
                                ${rsvpHtml}
                            </div>
                        </div>
                        ` : ''}

                        <!-- SLIDE 4: GET PHOTOS (Renders if showPhotos is active) -->
                        ${showPhotos ? `
                        <div class="env-slide">
                            <div class="env-slide-card space-y-3">
                                <h4 class="text-[10px] uppercase tracking-wider font-bold mb-0.5 text-center" style="color: ${colors.primary}">Event Photos</h4>
                                <p class="text-[8.5px] opacity-75 text-center leading-normal max-w-[240px]">Scan the QR code below or click the button to explore and share photos from our wedding celebration!</p>
                                ${d?.photosQr ? `
                                <div class="w-32 h-32 bg-white p-1.5 rounded-2xl border border-gray-100 flex items-center justify-center shadow-inner mx-auto">
                                    <img src="${d.photosQr}" class="w-full h-full object-contain rounded-xl">
                                </div>
                                ` : `
                                <div class="text-3xl opacity-30 py-2 text-center" style="color: ${colors.primary}">
                                    <i class="fa-solid fa-qrcode animate-pulse"></i>
                                </div>
                                `}
                                ${d?.photosLink ? `
                                <a href="${escape(d.photosLink)}" target="_blank" rel="noopener noreferrer" class="env-gold-btn inline-flex items-center justify-center gap-1.5 px-4 py-2 w-full rounded text-[9px] uppercase tracking-wider no-underline text-center transition active:scale-95">
                                    <i class="fa-solid fa-arrow-up-right-from-square"></i> Go to Gallery
                                </a>
                                ` : ''}
                            </div>
                        </div>
                        ` : ''}

                    </div>
                </div>

                <!-- FIXED NAVIGATION BAR -->
                <div class="env-pager-panel">
                    <button type="button" class="env-pager-btn" onclick="window.changeEnvSlide(this, -1)">
                        <i class="fa-solid fa-arrow-left"></i>
                    </button>
                    
                    <span class="text-[8px] font-bold opacity-60 tracking-wider uppercase env-slide-indicator">Slide 1 of ${totalSlidesCount}</span>
                    
                    <button type="button" class="env-pager-btn" onclick="window.changeEnvSlide(this, 1)">
                        <i class="fa-solid fa-arrow-right"></i>
                    </button>
                </div>

            </div>
        `;
    }
});
