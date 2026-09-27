const luxurySvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">
    <rect width="100%" height="100%" fill="#0F172A"/>
    <rect x="20" y="20" width="360" height="260" rx="10" fill="none" stroke="#E2B13C" stroke-width="2" opacity="0.9"/>
    <text x="50%" y="130" dominant-baseline="middle" text-anchor="middle" font-family="'Cinzel', serif" font-weight="bold" font-size="28" letter-spacing="4" fill="#E2B13C">LUXURY</text>
    <text x="50%" y="170" dominant-baseline="middle" text-anchor="middle" font-family="'Playfair Display', serif" font-size="14" font-style="italic" fill="#FFFFFF">Royal Slides</text>
    <path d="M 180 220 L 200 200 L 220 220 Z" fill="#E2B13C"/>
</svg>`;
const luxuryThumb = 'data:image/svg+xml;base64,' + btoa(luxurySvg);

window.registerTemplate({
    id: 'bold-luxury-slides',
    name: 'Bold Royal Luxury Slides',
    thumb: luxuryThumb,
    freeform: false,
    scrollable: false, // Non-scrolling
    defaults: {
        colors: {
            primary: '#E2B13C',     // Bright Imperial Gold
            bg: '#0F172A',          // Midnight Royal Slate/Navy
            text: '#FFFFFF'         // Absolute White
        },
        fonts: {
            heading: "'Cinzel', serif"
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
                return isEditMode ? `<div class="lx-hidden" data-edit="${key}">${contentHtml}</div>` : '';
            }
            return isEditMode
                ? `<div class="lx-editable" data-edit="${key}">
                     <span class="lx-edit-pen" title="Edit this section"><i class="fa-solid fa-pen"></i></span>
                     ${contentHtml}
                   </div>`
                : contentHtml;
        };

        const bismillahText = escape(d?.content?.bismillah, 'بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ');
        const headingText = escape(d?.content?.heading, 'Royal Invitation');
        const groomName = escape(d?.couple?.groom, 'Groom Name');
        const brideName = escape(d?.couple?.bride, 'Bride Name');
        const groomPhoto = d?.couple?.groomPhoto;
        const bridePhoto = d?.couple?.bridePhoto;
        
        const defaultInitials = `${groomName.charAt(0)}${brideName.charAt(0)}`.toUpperCase();
        const displayInitials = d?.couple?.customInitials ? escape(d.couple.customInitials) : defaultInitials;

        const invitationMsg = escape(d?.content?.message, 'With great joy, we request the honour of your presence at our wedding.');
        const arabicQuote = escape(d?.content?.arabicText, 'وَمِنْ آيَاتِهِ أَنْ خَلَقَ لَكُم مِّنْ أَنفُសِكُمْ أَزْوَاجًا');
        const translationQuote = escape(d?.content?.translation, '"He has put love and mercy between your hearts."');
        const eventTitle = escape(d?.mainEvent?.title, 'Nikah Ceremony');
        
        const dateParts = /^\d{4}-\d{2}-\d{2}$/.test(d?.mainEvent?.date || '') ? d.mainEvent.date.split('-').map(Number) : null;
        const selectedDate = dateParts ? new Date(dateParts[0], dateParts[1] - 1, dateParts[2]) : null;
        const eventDate = selectedDate ? new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(selectedDate) : 'Wedding Date';
        const monthLabel = selectedDate ? new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(selectedDate) : 'Wedding Month';

        const formatTime = (t) => window.formatTimeTo12Hour ? window.formatTimeTo12Hour(t) : t;
        const eventTime = formatTime(escape(d?.mainEvent?.time, '11:00 AM'));
        const endTime = d?.mainEvent?.endTime ? formatTime(escape(d.mainEvent.endTime)) : '';
        const displayTime = endTime ? `${eventTime} - ${endTime}` : eventTime;

        const eventVenue = escape(d?.mainEvent?.venue, 'Grand Royal Palace');
        const eventAddress = escape(d?.mainEvent?.address, 'Kochi, Kerala');
        const mapUrl = d?.mainEvent?.mapUrl;
        const isValidMapUrl = typeof mapUrl === 'string' && /^https?:\/\//i.test(mapUrl.trim());
        const safeMapUrl = isValidMapUrl ? escape(mapUrl.trim()) : '';

        // Swipe & nav initialization
        if (!window.initLxSwipe) {
            window.initLxSwipe = function(el) {
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
                            window.changeLxSlide(el, 1);
                        } else {
                            window.changeLxSlide(el, -1);
                        }
                    }
                }, { passive: true });
            };

            window.changeLxSlide = function(btnOrContainer, direction) {
                const root = btnOrContainer.closest('.lx-template-root');
                const track = root.querySelector('.lx-slides-track');
                const slides = root.querySelectorAll('.lx-slide');
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
                const indicator = root.querySelector('.lx-slide-indicator');
                if (indicator) indicator.innerText = `Slide ${nextIndex + 1} of ${slides.length}`;
            };
        }

        // Calendar View
        const calendar = (() => {
            if (!selectedDate) return '<div class="lx-calendar-empty text-xs opacity-50">Date not configured</div>';
            const year = selectedDate.getFullYear(), month = selectedDate.getMonth(), selectedDay = selectedDate.getDate();
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            const firstDay = (new Date(year, month, 1).getDay() + 6) % 7;
            const cells = Array.from({ length: firstDay }, () => '<span></span>');
            for (let day = 1; day <= daysInMonth; day++) {
                cells.push(`<span class="${day === selectedDay ? 'lx-selected-day' : ''}">${day}${day === selectedDay ? '<b>♥</b>' : ''}</span>`);
            }
            return `<div class="lx-calendar-week">${['M', 'T', 'W', 'T', 'F', 'S', 'S'].map(day => `<span>${day}</span>`).join('')}</div><div class="lx-calendar-grid">${cells.join('')}</div>`;
        })();

        // Portraits layout
        let portraitsHtml = '';
        if (groomPhoto || bridePhoto) {
            portraitsHtml = `<div class="flex items-center justify-center gap-2.5 my-1 w-full shrink-0">`;
            if (groomPhoto) {
                portraitsHtml += `<div class="relative w-10 h-10 rounded-full p-0.5 shrink-0" style="border: 1px solid ${colors.primary};">
                                     <img src="${groomPhoto}" class="w-full h-full object-cover rounded-full aspect-square" />
                                 </div>`;
            }
            if (groomPhoto && bridePhoto) {
                portraitsHtml += `<span class="text-xs font-serif italic opacity-50" style="color: ${colors.primary};">&amp;</span>`;
            }
            if (bridePhoto) {
                portraitsHtml += `<div class="relative w-10 h-10 rounded-full p-0.5 shrink-0" style="border: 1px solid ${colors.primary};">
                                     <img src="${bridePhoto}" class="w-full h-full object-cover rounded-full aspect-square" />
                                 </div>`;
            }
            portraitsHtml += `</div>`;
        }

        // Direction map
        const mapBtnHtml = (set.showMap !== false && isValidMapUrl && !isEditMode) ? `
            <a href="${safeMapUrl}" target="_blank" rel="noopener noreferrer" class="lx-gold-btn inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-[9px] uppercase tracking-wider no-underline transition active:scale-95">
                <i class="fa-solid fa-location-dot"></i> Directions
            </a>
        ` : (isEditMode ? `<span class="lx-gold-btn inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-[9px] uppercase tracking-wider opacity-70 cursor-not-allowed"><i class="fa-solid fa-location-dot"></i> Map</span>` : '');

        const reminderBtnHtml = isEditMode
            ? `<span class="lx-gold-btn inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-[9px] uppercase tracking-wider opacity-70 cursor-not-allowed"><i class="fa-regular fa-bell"></i> Remind</span>`
            : `<button type="button" class="lx-gold-btn inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-[9px] uppercase tracking-wider transition active:scale-95" onclick="addWeddingReminder(this)" data-title="${escape(encodeURIComponent(`${eventTitle} — ${groomName} & ${brideName}`))}" data-location="${escape(encodeURIComponent(`${eventVenue}, ${eventAddress}`))}" data-date="${d?.mainEvent?.date || ''}" data-time="${escape(eventTime)}"><i class="fa-regular fa-bell"></i> Remind</button>`;

        // RSVP Block
        const rsvpHtml = (showRsvp && !isEditMode) ? `
            <div class="w-full max-w-[280px] p-1 text-center my-0.5 mx-auto shrink-0" style="color: #1F2937;">
                <h4 class="text-[10px] uppercase tracking-wider font-bold mb-1" style="color: ${colors.primary}">Will You Attend?</h4>
                ${window.renderPublicRsvpForm ? window.renderPublicRsvpForm(colors, isEditMode, false) : ''}
            </div>
        ` : (isEditMode && showRsvp ? `<div class="w-full max-w-[280px] p-2 text-center border border-dashed text-[8px] opacity-70" style="border-color: ${colors.primary}60; color: #1F2937;">RSVP Form Panel</div>` : '');

        let totalSlidesCount = 2;
        if (showRsvp) totalSlidesCount++;
        if (showPhotos) totalSlidesCount++;

        const styles = `
            <style>
                .lx-template-root {
                    background-color: ${colors.bg};
                    color: ${colors.text};
                    font-family: 'Cinzel', serif;
                    height: 100%;
                    min-height: 100dvh;
                    width: 100%;
                    max-width: 480px;
                    margin: 0 auto;
                    position: relative;
                    overflow: hidden;
                    box-sizing: border-box;
                    padding: 16px 16px 50px;
                }

                /* Spring Horizontal Carousel Track */
                .lx-slides-track {
                    display: flex;
                    width: 100%;
                    height: 100%;
                    transition: transform 0.65s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    will-change: transform;
                }

                .lx-slide {
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
                .lx-slide-card {
                    background: rgba(255, 255, 255, 0.88);
                    -webkit-backdrop-filter: blur(14px);
                    backdrop-filter: blur(14px);
                    border: 1.5px solid rgba(255, 255, 255, 0.6);
                    border-radius: 28px;
                    padding: 22px 16px;
                    width: 100%;
                    max-width: 320px;
                    max-height: 85vh;
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
                .lx-slide-card p, .lx-slide-card div:not(.lx-arabic-text) {
                    color: #1F2937;
                    font-family: 'Poppins', sans-serif;
                }

                /* Editable borders */
                .lx-editable {
                    position: relative;
                    cursor: pointer;
                    border-radius: 4px;
                    transition: all 0.2s ease;
                }
                .lx-editable:hover {
                    outline: 1.5px dashed ${colors.primary};
                    background: rgba(226, 177, 60, 0.05);
                }
                .lx-edit-pen {
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
                .lx-hidden {
                    opacity: 0.25;
                    filter: grayscale(90%);
                }

                /* Luxury navigation panel */
                .lx-pager-panel {
                    position: absolute;
                    bottom: 8px;
                    left: 12px;
                    right: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    z-index: 30;
                    border-top: 1.5px solid ${colors.primary}30;
                    padding-top: 6px;
                }
                .lx-pager-btn {
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
                .lx-pager-btn:active {
                    transform: scale(0.9);
                }

                .lx-gold-btn {
                    background: linear-gradient(135deg, #FFEAA7 0%, ${colors.primary} 70%, #AA8022 100%);
                    color: ${colors.bg};
                    font-weight: 700;
                    box-shadow: 0 4px 10px rgba(226, 177, 60, 0.2);
                    border-radius: 6px;
                    font-size: 9px;
                }

                .lx-calendar-week { display: grid; grid-template-columns: repeat(7, 1fr); font-size: 7.5px; color: rgba(0,0,0,0.5); width: 100%; max-width: 160px; margin-bottom: 2px; font-family: 'Poppins', sans-serif; }
                .lx-calendar-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 3px 2px; font-size: 8.5px; width: 100%; max-width: 160px; color: #1F2937; font-family: 'Poppins', sans-serif; }
                .lx-calendar-grid span { position: relative; display: grid; place-items: center; min-height: 14px; }
                .lx-selected-day { background: rgba(226,177,60,0.25); border-radius: 50%; font-weight: 700; border: 1px solid ${colors.primary}; color: ${colors.primary} !important; }
            </style>
        `;

        return `
            ${styles}
            <div class="lx-template-root bg-cover bg-center bg-no-repeat flex flex-col justify-between" 
                 onpointerdown="if(!this.dataset.swipeInit){window.initLxSwipe(this); this.dataset.swipeInit=true;}"
                 style="${d?.design?.bgImage ? `background-image: url('${d.design.bgImage}');` : ''}">
                
                <!-- HORIZONTAL CAROUSEL TRACK -->
                <div class="lx-slides-track" data-active-index="0" style="transform: translateX(0%);">
                    
                    <!-- SLIDE 1: INTRO & COUPLE -->
                    <div class="lx-slide">
                        <div class="lx-slide-card space-y-2.5">
                            ${edit('bismillah', `<div class="lx-arabic-text font-arabic text-lg tracking-wide leading-loose text-center" style="color: ${colors.primary}">${bismillahText}</div>`, 'showBismillah')}
                            
                            ${edit('heading', `<div class="text-[9px] tracking-[0.25em] font-semibold opacity-90 uppercase text-center" style="color: ${colors.primary}">${headingText}</div>`, 'showHeading')}
                            
                            ${edit('couple', `
                                <div class="w-full flex flex-col items-center">
                                    <div class="font-serif text-xl font-bold tracking-wide text-center" style="color: ${colors.primary} !important;">${groomName}</div>
                                    <span class="text-xs opacity-50 my-0.5 font-serif text-center">&amp;</span>
                                    <div class="font-serif text-xl font-bold tracking-wide text-center" style="color: ${colors.primary} !important;">${brideName}</div>
                                    ${portraitsHtml}
                                </div>
                            `, 'showCouple')}

                            ${edit('message', `<div class="text-[10px] leading-relaxed italic opacity-85 px-4 font-serif max-w-[270px] text-center">"${invitationMsg}"</div>`, 'showMessage')}
                            
                            ${edit('quran', `
                                <div class="px-3 py-1.5 rounded-xl max-w-[260px] mx-auto scale-90 border text-center" style="background: rgba(255,255,255,0.4); border-color: ${colors.primary}15;">
                                    <div class="lx-arabic-text font-arabic text-sm leading-loose" style="color: ${colors.primary}">${arabicQuote}</div>
                                    <div class="text-[8px] opacity-75 mt-0.5 leading-normal italic">“${translationQuote}”</div>
                                </div>
                            `, 'showQuote')}
                            
                            <div class="text-[8px] opacity-40 tracking-widest animate-pulse mt-1 text-center" style="color: ${colors.primary}"><i class="fa-solid fa-arrows-left-right"></i> Swipe or tap Next</div>
                        </div>
                    </div>

                    <!-- SLIDE 2: THE CEREMONY & CALENDAR -->
                    <div class="lx-slide">
                        <div class="lx-slide-card space-y-3">
                            ${edit('mainEvent', `
                                <div class="w-full text-center flex flex-col items-center">
                                    <span class="text-[8px] tracking-[0.25em] font-bold opacity-50 uppercase mb-0.5" style="color: ${colors.primary}">SACRED CELEBRATION</span>
                                    <h3 class="font-serif text-xs font-bold uppercase tracking-wider mb-1" style="color: ${colors.primary}">${eventTitle}</h3>
                                    
                                    <div class="space-y-0.5 text-[10px] opacity-90 leading-tight text-center">
                                        <p class="font-bold"><i class="fa-regular fa-calendar-check mr-1" style="color: ${colors.primary}"></i>${eventDate}</p>
                                        <p><i class="fa-regular fa-clock mr-1" style="color: ${colors.primary}"></i>${displayTime}</p>
                                        <p class="font-semibold mt-0.5"><i class="fa-solid fa-hotel mr-1" style="color: ${colors.primary}"></i>${eventVenue}</p>
                                        <p class="text-[8px] opacity-70">${eventAddress}</p>
                                    </div>
                                    
                                    <div class="flex justify-center items-center gap-1.5 mt-1.5">
                                        ${mapBtnHtml}
                                        ${reminderBtnHtml}
                                    </div>
                                </div>
                            `, 'showEvent')}

                            ${edit('mainEvent', `
                                <div class="flex flex-col items-center scale-[0.82] origin-top">
                                    <div class="text-[8.5px] font-bold mb-1" style="color: ${colors.primary}"><i class="fa-regular fa-calendar-days mr-1"></i> ${monthLabel}</div>
                                    ${calendar}
                                </div>
                            `, 'showEvent')}

                            ${set.showCountdown ? edit('mainEvent', window.renderCountdownHtml ? window.renderCountdownHtml(d, colors, 'scale-[0.68] origin-top my-0.5') : '', 'showCountdown') : ''}
                        </div>
                    </div>

                    <!-- SLIDE 3: RSVP (Only visible if active) -->
                    ${showRsvp ? `
                    <div class="lx-slide">
                        <div class="lx-slide-card">
                            ${rsvpHtml}
                        </div>
                    </div>
                    ` : ''}

                    <!-- SLIDE 4: GET PHOTOS (Renders if showPhotos is active) -->
                    ${showPhotos ? `
                    <div class="lx-slide">
                        <div class="lx-slide-card space-y-3">
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
                            <a href="${escape(d.photosLink)}" target="_blank" rel="noopener noreferrer" class="lx-gold-btn inline-flex items-center justify-center gap-1.5 px-4 py-2 w-full rounded text-[9px] uppercase tracking-wider no-underline text-center transition active:scale-95">
                                <i class="fa-solid fa-arrow-up-right-from-square"></i> Go to Gallery
                            </a>
                            ` : ''}
                        </div>
                    </div>
                    ` : ''}

                </div>

                <!-- FIXED NAVIGATION BAR -->
                <div class="lx-pager-panel">
                    <button type="button" class="lx-pager-btn" onclick="window.changeLxSlide(this, -1)">
                        <i class="fa-solid fa-chevron-left"></i>
                    </button>
                    
                    <span class="text-[8px] font-bold opacity-60 tracking-wider uppercase lx-slide-indicator" style="color: ${colors.primary}">Slide 1 of ${totalSlidesCount}</span>
                    
                    <button type="button" class="lx-pager-btn" onclick="window.changeLxSlide(this, 1)">
                        <i class="fa-solid fa-chevron-right"></i>
                    </button>
                </div>

            </div>
        `;
    }
});
