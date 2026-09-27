const minimalSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">
    <rect width="100%" height="100%" fill="#F9F6F0"/>
    <rect x="15" y="15" width="370" height="270" fill="none" stroke="#7D8C81" stroke-width="1" opacity="0.6"/>
    <text x="50%" y="130" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-weight="200" font-size="24" letter-spacing="4" fill="#2B2B2B">MINIMAL</text>
    <text x="50%" y="170" dominant-baseline="middle" text-anchor="middle" font-family="'Playfair Display', serif" font-size="14" font-style="italic" fill="#7D8C81">Modern Slides</text>
    <circle cx="200" cy="230" r="12" fill="#7D8C81" opacity="0.2"/>
</svg>`;
const minimalThumb = 'data:image/svg+xml;base64,' + btoa(minimalSvg);

window.registerTemplate({
    id: 'minimal-modern-slides',
    name: 'Minimal Modern Slides',
    thumb: minimalThumb,
    freeform: false,
    scrollable: false, // Non-scrolling
    defaults: {
        colors: {
            primary: '#7D8C81',     // Muted Sage Green
            bg: '#F9F6F0',          // Soft Warm Alabaster/Beige
            text: '#2B2B2B'         // Charcoal/Dark Slate
        },
        fonts: {
            heading: "'Montserrat', sans-serif"
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
                return isEditMode ? `<div class="mn-hidden" data-edit="${key}">${contentHtml}</div>` : '';
            }
            return isEditMode
                ? `<div class="mn-editable" data-edit="${key}">
                     <span class="mn-edit-pen" title="Edit this section"><i class="fa-solid fa-pen"></i></span>
                     ${contentHtml}
                   </div>`
                : contentHtml;
        };

        const bismillahText = escape(d?.content?.bismillah, 'بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ');
        const headingText = escape(d?.content?.heading, 'Save the Date');
        const groomName = escape(d?.couple?.groom, 'Groom Name');
        const brideName = escape(d?.couple?.bride, 'Bride Name');
        const groomPhoto = d?.couple?.groomPhoto;
        const bridePhoto = d?.couple?.bridePhoto;
        
        const defaultInitials = `${groomName.charAt(0)}${brideName.charAt(0)}`.toUpperCase();
        const displayInitials = d?.couple?.customInitials ? escape(d.couple.customInitials) : defaultInitials;

        const invitationMsg = escape(d?.content?.message, 'Please join us as we celebrate the beginning of our new life together.');
        const arabicQuote = escape(d?.content?.arabicText, 'وَمِنْ آيَاتِهِ أَنْ خَلَقَ لَكُم مِّنْ أَنفُسِكُمْ أَزْوَاجًا');
        const translationQuote = escape(d?.content?.translation, '"And among His signs is that He created for you mates that you may find tranquility in them."');
        const eventTitle = escape(d?.mainEvent?.title, 'Nikah Ceremony');
        
        const dateParts = /^\d{4}-\d{2}-\d{2}$/.test(d?.mainEvent?.date || '') ? d.mainEvent.date.split('-').map(Number) : null;
        const selectedDate = dateParts ? new Date(dateParts[0], dateParts[1] - 1, dateParts[2]) : null;
        const eventDate = selectedDate ? new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(selectedDate) : 'Wedding Date';
        const monthLabel = selectedDate ? new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(selectedDate) : 'Wedding Month';

        const formatTime = (t) => window.formatTimeTo12Hour ? window.formatTimeTo12Hour(t) : t;
        const eventTime = formatTime(escape(d?.mainEvent?.time, '11:00 AM'));
        const endTime = d?.mainEvent?.endTime ? formatTime(escape(d.mainEvent.endTime)) : '';
        const displayTime = endTime ? `${eventTime} - ${endTime}` : eventTime;

        const eventVenue = escape(d?.mainEvent?.venue, 'Grand Banquet Auditorium');
        const eventAddress = escape(d?.mainEvent?.address, 'Kochi, Kerala');
        const mapUrl = d?.mainEvent?.mapUrl;
        const isValidMapUrl = typeof mapUrl === 'string' && /^https?:\/\//i.test(mapUrl.trim());
        const safeMapUrl = isValidMapUrl ? escape(mapUrl.trim()) : '';

        // Swipe & nav initialization
        if (!window.initMnSwipe) {
            window.initMnSwipe = function(el) {
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
                            window.changeMnSlide(el, 1);
                        } else {
                            window.changeMnSlide(el, -1);
                        }
                    }
                }, { passive: true });
            };

            window.changeMnSlide = function(btnOrContainer, direction) {
                const root = btnOrContainer.closest('.mn-template-root');
                const track = root.querySelector('.mn-slides-track');
                const slides = root.querySelectorAll('.mn-slide');
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
                const indicator = root.querySelector('.mn-slide-indicator');
                if (indicator) indicator.innerText = `Slide ${nextIndex + 1} of ${slides.length}`;
            };
        }

        // Calendar View
        const calendar = (() => {
            if (!selectedDate) return '<div class="mn-calendar-empty text-xs opacity-50">Date not configured</div>';
            const year = selectedDate.getFullYear(), month = selectedDate.getMonth(), selectedDay = selectedDate.getDate();
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            const firstDay = (new Date(year, month, 1).getDay() + 6) % 7;
            const cells = Array.from({ length: firstDay }, () => '<span></span>');
            for (let day = 1; day <= daysInMonth; day++) {
                cells.push(`<span class="${day === selectedDay ? 'mn-selected-day' : ''}">${day}${day === selectedDay ? '<b>♥</b>' : ''}</span>`);
            }
            return `<div class="mn-calendar-week">${['M', 'T', 'W', 'T', 'F', 'S', 'S'].map(day => `<span>${day}</span>`).join('')}</div><div class="mn-calendar-grid">${cells.join('')}</div>`;
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
            <a href="${safeMapUrl}" target="_blank" rel="noopener noreferrer" class="mn-sage-btn inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-[9px] uppercase tracking-wider no-underline transition active:scale-95">
                <i class="fa-solid fa-location-dot"></i> Directions
            </a>
        ` : (isEditMode ? `<span class="mn-sage-btn inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-[9px] uppercase tracking-wider opacity-70 cursor-not-allowed"><i class="fa-solid fa-location-dot"></i> Map</span>` : '');

        const reminderBtnHtml = isEditMode
            ? `<span class="mn-sage-btn inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-[9px] uppercase tracking-wider opacity-70 cursor-not-allowed"><i class="fa-regular fa-bell"></i> Remind</span>`
            : `<button type="button" class="mn-sage-btn inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-[9px] uppercase tracking-wider transition active:scale-95" onclick="addWeddingReminder(this)" data-title="${escape(encodeURIComponent(`${eventTitle} — ${groomName} & ${brideName}`))}" data-location="${escape(encodeURIComponent(`${eventVenue}, ${eventAddress}`))}" data-date="${d?.mainEvent?.date || ''}" data-time="${escape(eventTime)}"><i class="fa-regular fa-bell"></i> Remind</button>`;

        // RSVP Block
        const rsvpHtml = (showRsvp && !isEditMode) ? `
            <div class="w-full max-w-[280px] p-1 text-center my-0.5 mx-auto shrink-0" style="color: #2B2B2B;">
                <h4 class="text-[10px] uppercase tracking-wider font-bold mb-1" style="color: ${colors.primary}">Will You Attend?</h4>
                ${window.renderPublicRsvpForm ? window.renderPublicRsvpForm(colors, isEditMode, false) : ''}
            </div>
        ` : (isEditMode && showRsvp ? `<div class="w-full max-w-[280px] p-2 text-center border border-dashed text-[8px] opacity-70" style="border-color: ${colors.primary}60; color: #2B2B2B;">RSVP Form Panel</div>` : '');

        let totalSlidesCount = 2;
        if (showRsvp) totalSlidesCount++;
        if (showPhotos) totalSlidesCount++;

        const styles = `
            <style>
                .mn-template-root {
                    background-color: ${colors.bg};
                    color: ${colors.text};
                    font-family: 'Montserrat', sans-serif;
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
                .mn-slides-track {
                    display: flex;
                    width: 100%;
                    height: 100%;
                    transition: transform 0.65s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    will-change: transform;
                }

                .mn-slide {
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
                .mn-slide-card {
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
                    box-shadow: 0 12px 36px rgba(0, 0, 0, 0.08);
                    box-sizing: border-box;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    margin: auto;
                    color: #2B2B2B !important;
                }

                /* Force child elements to inherit regular dark color for high contrast on soft white backdrop */
                .mn-slide-card p, .mn-slide-card div:not(.mn-arabic-text) {
                    color: #2B2B2B;
                }

                /* Editable borders */
                .mn-editable {
                    position: relative;
                    cursor: pointer;
                    border-radius: 4px;
                    transition: all 0.2s ease;
                }
                .mn-editable:hover {
                    outline: 1.5px dashed #3B82F6;
                    background: rgba(59, 130, 246, 0.04);
                }
                .mn-edit-pen {
                    position: absolute;
                    top: -6px;
                    right: -6px;
                    width: 16px;
                    height: 16px;
                    background: #2563EB;
                    color: #fff;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 7px;
                    z-index: 50;
                }
                .mn-hidden {
                    opacity: 0.25;
                    filter: grayscale(90%);
                }

                /* Minimal navigation pane */
                .mn-pager-panel {
                    position: absolute;
                    bottom: 8px;
                    left: 12px;
                    right: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    z-index: 30;
                    border-top: 1px solid rgba(0,0,0,0.06);
                    padding-top: 6px;
                }
                .mn-pager-btn {
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
                .mn-pager-btn:active {
                    transform: scale(0.85);
                }

                .mn-sage-btn {
                    border: 1px solid ${colors.primary};
                    background: transparent;
                    color: #2B2B2B;
                    font-weight: 600;
                    border-radius: 6px;
                    font-size: 9px;
                }
                .mn-sage-btn:hover {
                    background: ${colors.primary};
                    color: white;
                }

                .mn-calendar-week { display: grid; grid-template-columns: repeat(7, 1fr); font-size: 7.5px; color: rgba(0,0,0,0.5); width: 100%; max-width: 160px; margin-bottom: 2px; }
                .mn-calendar-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 3px 2px; font-size: 8.5px; width: 100%; max-width: 160px; color: #2B2B2B; }
                .mn-calendar-grid span { position: relative; display: grid; place-items: center; min-height: 14px; }
                .mn-selected-day { background: ${colors.primary}20; border-radius: 50%; font-weight: 700; border: 1px solid ${colors.primary}; color: ${colors.primary} !important; }
            </style>
        `;

        return `
            ${styles}
            <div class="mn-template-root bg-cover bg-center bg-no-repeat flex flex-col justify-between" 
                 onpointerdown="if(!this.dataset.swipeInit){window.initMnSwipe(this); this.dataset.swipeInit=true;}"
                 style="${d?.design?.bgImage ? `background-image: url('${d.design.bgImage}');` : ''}">
                
                <!-- HORIZONTAL CAROUSEL TRACK -->
                <div class="mn-slides-track" data-active-index="0" style="transform: translateX(0%);">
                    
                    <!-- SLIDE 1: INTRO & COUPLE -->
                    <div class="mn-slide">
                        <div class="mn-slide-card space-y-2">
                            ${edit('bismillah', `<div class="mn-arabic-text font-arabic text-base tracking-normal text-center" style="color: ${colors.primary}">${bismillahText}</div>`, 'showBismillah')}
                            
                            <div class="w-8 h-[1px] mx-auto opacity-30" style="background: ${colors.primary}"></div>
                            
                            ${edit('heading', `<div class="text-[8px] tracking-[0.3em] font-bold opacity-80 uppercase text-center" style="color: ${colors.primary}">${headingText}</div>`, 'showHeading')}
                            
                            ${edit('couple', `
                                <div class="w-full flex flex-col items-center">
                                    <div class="font-serif text-lg tracking-wider uppercase font-light text-center">${groomName}</div>
                                    <span class="text-[9px] opacity-40 font-serif italic my-0.5">&amp;</span>
                                    <div class="font-serif text-lg tracking-wider uppercase font-light text-center">${brideName}</div>
                                    ${portraitsHtml}
                                </div>
                            `, 'showCouple')}

                            ${edit('message', `<div class="text-[9.5px] leading-relaxed opacity-75 px-4 font-light max-w-[270px] text-center">"${invitationMsg}"</div>`, 'showMessage')}
                            
                            ${edit('quran', `
                                <div class="px-2.5 py-1 max-w-[250px] mx-auto scale-90 border-t border-b border-gray-200/50 text-center">
                                    <div class="mn-arabic-text font-arabic text-sm leading-normal" style="color: ${colors.primary}">${arabicQuote}</div>
                                    <div class="text-[7.5px] opacity-60 leading-normal italic mt-0.5">“${translationQuote}”</div>
                                </div>
                            `, 'showQuote')}
                            
                            <div class="text-[8px] opacity-40 tracking-widest animate-pulse mt-0.5 text-center"><i class="fa-solid fa-arrows-left-right text-[9px] mr-1"></i>Swipe to explore</div>
                        </div>
                    </div>

                    <!-- SLIDE 2: CEREMONY DETAILS -->
                    <div class="mn-slide">
                        <div class="mn-slide-card space-y-3">
                            ${edit('mainEvent', `
                                <div class="w-full text-center flex flex-col items-center">
                                    <span class="text-[8px] tracking-[0.25em] font-semibold opacity-50 uppercase mb-0.5" style="color: ${colors.primary}">JOIN THE CELEBRATION</span>
                                    <h3 class="font-sans text-xs font-bold uppercase tracking-wider mb-1" style="color: ${colors.primary}">${eventTitle}</h3>
                                    
                                    <div class="space-y-0.5 text-[9.5px] opacity-85 leading-normal text-center">
                                        <p class="font-bold"><i class="fa-regular fa-calendar mr-1" style="color: ${colors.primary}"></i>${eventDate}</p>
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

                    <!-- SLIDE 3: RSVP (Renders if showRsvp is active) -->
                    ${showRsvp ? `
                    <div class="mn-slide">
                        <div class="mn-slide-card">
                            ${rsvpHtml}
                        </div>
                    </div>
                    ` : ''}

                    <!-- SLIDE 4: GET PHOTOS (Renders if showPhotos is active) -->
                    ${showPhotos ? `
                    <div class="mn-slide">
                        <div class="mn-slide-card space-y-3">
                            <h4 class="text-[10px] uppercase tracking-wider font-bold mb-0.5" style="color: ${colors.primary}">Event Photos</h4>
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
                            <a href="${escape(d.photosLink)}" target="_blank" rel="noopener noreferrer" class="mn-sage-btn inline-flex items-center justify-center gap-1.5 px-4 py-2 w-full rounded text-[9px] uppercase tracking-wider no-underline transition active:scale-95">
                                <i class="fa-solid fa-arrow-up-right-from-square"></i> Go to Gallery
                            </a>
                            ` : ''}
                        </div>
                    </div>
                    ` : ''}

                </div>

                <!-- FIXED NAVIGATION BAR -->
                <div class="mn-pager-panel">
                    <button type="button" class="mn-pager-btn" onclick="window.changeMnSlide(this, -1)">
                        <i class="fa-solid fa-arrow-left"></i>
                    </button>
                    
                    <span class="text-[8px] font-bold opacity-60 tracking-wider uppercase mn-slide-indicator">Slide 1 of ${totalSlidesCount}</span>
                    
                    <button type="button" class="mn-pager-btn" onclick="window.changeMnSlide(this, 1)">
                        <i class="fa-solid fa-arrow-right"></i>
                    </button>
                </div>

            </div>
        `;
    }
});
