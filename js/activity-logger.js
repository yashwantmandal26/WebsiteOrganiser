// =============================================================================
// js/activity-logger.js — Security, Device & Location Tracking, Audit Trail & Undo
// =============================================================================

(function (WO) {

    const DELETIONS_TRACKER_KEY = 'websiteorganiser_deletions_log';
    const LOCAL_LOGS_KEY        = 'websiteorganiser_local_activity_logs';
    const LOCATION_CACHE_KEY    = 'wo_user_location_cache';
    const MAX_LOCAL_LOGS        = 200;
    const RATE_LIMIT_WINDOW_MS  = 15 * 60 * 1000; // 15 minutes
    const RATE_LIMIT_MAX_DELETES = 5;

    // ─── 1. Smart Device & Commercial Model Decoder ──────────────────────────
    function decodeDeviceModel(rawModel, ua = '') {
        if (!rawModel) rawModel = '';
        let m = rawModel.trim();
        const userAgent = ua || (typeof navigator !== 'undefined' ? navigator.userAgent : '') || '';

        // 1. Samsung Galaxy Models
        if (/SM-S928/i.test(m) || /SM-S928/i.test(userAgent)) return { name: 'Samsung Galaxy S24 Ultra', code: m || 'SM-S928', isMobile: true, icon: '📱' };
        if (/SM-S926/i.test(m) || /SM-S926/i.test(userAgent)) return { name: 'Samsung Galaxy S24+', code: m || 'SM-S926', isMobile: true, icon: '📱' };
        if (/SM-S921/i.test(m) || /SM-S921/i.test(userAgent)) return { name: 'Samsung Galaxy S24', code: m || 'SM-S921', isMobile: true, icon: '📱' };
        if (/SM-S918/i.test(m) || /SM-S918/i.test(userAgent)) return { name: 'Samsung Galaxy S23 Ultra', code: m || 'SM-S918', isMobile: true, icon: '📱' };
        if (/SM-S916/i.test(m) || /SM-S916/i.test(userAgent)) return { name: 'Samsung Galaxy S23+', code: m || 'SM-S916', isMobile: true, icon: '📱' };
        if (/SM-S911/i.test(m) || /SM-S911/i.test(userAgent)) return { name: 'Samsung Galaxy S23', code: m || 'SM-S911', isMobile: true, icon: '📱' };
        if (/SM-S908/i.test(m) || /SM-S908/i.test(userAgent)) return { name: 'Samsung Galaxy S22 Ultra', code: m || 'SM-S908', isMobile: true, icon: '📱' };
        if (/SM-S906/i.test(m) || /SM-S906/i.test(userAgent)) return { name: 'Samsung Galaxy S22+', code: m || 'SM-S906', isMobile: true, icon: '📱' };
        if (/SM-S901/i.test(m) || /SM-S901/i.test(userAgent)) return { name: 'Samsung Galaxy S22', code: m || 'SM-S901', isMobile: true, icon: '📱' };
        if (/SM-G998/i.test(m) || /SM-G998/i.test(userAgent)) return { name: 'Samsung Galaxy S21 Ultra', code: m || 'SM-G998', isMobile: true, icon: '📱' };
        if (/SM-G996/i.test(m) || /SM-G996/i.test(userAgent)) return { name: 'Samsung Galaxy S21+', code: m || 'SM-G996', isMobile: true, icon: '📱' };
        if (/SM-G991/i.test(m) || /SM-G991/i.test(userAgent)) return { name: 'Samsung Galaxy S21', code: m || 'SM-G991', isMobile: true, icon: '📱' };
        if (/SM-G990/i.test(m) || /SM-G990/i.test(userAgent)) return { name: 'Samsung Galaxy S21 FE', code: m || 'SM-G990', isMobile: true, icon: '📱' };
        if (/SM-G780|SM-G781/i.test(m) || /SM-G78/i.test(userAgent)) return { name: 'Samsung Galaxy S20 FE', code: m || 'SM-G780', isMobile: true, icon: '📱' };
        if (/SM-F946|SM-F956/i.test(m)) return { name: 'Samsung Galaxy Z Fold', code: m, isMobile: true, icon: '📱' };
        if (/SM-F731|SM-F741/i.test(m)) return { name: 'Samsung Galaxy Z Flip', code: m, isMobile: true, icon: '📱' };
        if (/SM-A556/i.test(m)) return { name: 'Samsung Galaxy A55 5G', code: m, isMobile: true, icon: '📱' };
        if (/SM-A546/i.test(m)) return { name: 'Samsung Galaxy A54 5G', code: m, isMobile: true, icon: '📱' };
        if (/SM-A356/i.test(m)) return { name: 'Samsung Galaxy A35 5G', code: m, isMobile: true, icon: '📱' };
        if (/SM-A346/i.test(m)) return { name: 'Samsung Galaxy A34 5G', code: m, isMobile: true, icon: '📱' };
        if (/SM-A156|SM-A155/i.test(m)) return { name: 'Samsung Galaxy A15', code: m, isMobile: true, icon: '📱' };
        if (/SM-A146|SM-A145/i.test(m)) return { name: 'Samsung Galaxy A14', code: m, isMobile: true, icon: '📱' };
        if (/^SM-A\d+/i.test(m)) return { name: `Samsung Galaxy A-Series`, code: m, isMobile: true, icon: '📱' };
        if (/^SM-M\d+/i.test(m)) return { name: `Samsung Galaxy M-Series`, code: m, isMobile: true, icon: '📱' };
        if (/^SM-F\d+/i.test(m)) return { name: `Samsung Galaxy F/Z-Series`, code: m, isMobile: true, icon: '📱' };
        if (/^SM-/i.test(m)) return { name: `Samsung Galaxy (${m})`, code: m, isMobile: true, icon: '📱' };

        // 2. OnePlus & Oppo
        if (/CPH2581|CPH2609/i.test(m)) return { name: 'OnePlus 12', code: m, isMobile: true, icon: '📱' };
        if (/CPH2611/i.test(m)) return { name: 'OnePlus 12R', code: m, isMobile: true, icon: '📱' };
        if (/CPH2449|CPH2447/i.test(m)) return { name: 'OnePlus 11', code: m, isMobile: true, icon: '📱' };
        if (/CPH2451/i.test(m)) return { name: 'OnePlus 11R', code: m, isMobile: true, icon: '📱' };
        if (/CPH2579/i.test(m)) return { name: 'OnePlus Nord CE 4', code: m, isMobile: true, icon: '📱' };
        if (/CPH2493/i.test(m)) return { name: 'OnePlus Nord CE 3', code: m, isMobile: true, icon: '📱' };
        if (/^CPH\d+/i.test(m)) return { name: `OnePlus / Oppo`, code: m, isMobile: true, icon: '📱' };

        // 3. Google Pixel
        if (/Pixel 9 Pro/i.test(m) || /Pixel 9 Pro/i.test(userAgent)) return { name: 'Google Pixel 9 Pro', code: m || 'Pixel 9 Pro', isMobile: true, icon: '📱' };
        if (/Pixel 9/i.test(m) || /Pixel 9/i.test(userAgent)) return { name: 'Google Pixel 9', code: m || 'Pixel 9', isMobile: true, icon: '📱' };
        if (/Pixel 8 Pro/i.test(m) || /Pixel 8 Pro/i.test(userAgent)) return { name: 'Google Pixel 8 Pro', code: m || 'Pixel 8 Pro', isMobile: true, icon: '📱' };
        if (/Pixel 8a/i.test(m) || /Pixel 8a/i.test(userAgent)) return { name: 'Google Pixel 8a', code: m || 'Pixel 8a', isMobile: true, icon: '📱' };
        if (/Pixel 8/i.test(m) || /Pixel 8/i.test(userAgent)) return { name: 'Google Pixel 8', code: m || 'Pixel 8', isMobile: true, icon: '📱' };
        if (/Pixel 7/i.test(m) || /Pixel 7/i.test(userAgent)) return { name: 'Google Pixel 7', code: m || 'Pixel 7', isMobile: true, icon: '📱' };
        if (/Pixel/i.test(m) || /Pixel/i.test(userAgent)) return { name: 'Google Pixel', code: m || 'Pixel', isMobile: true, icon: '📱' };

        // 4. Apple iPhone / iPad / Mac
        if (/iPhone/i.test(userAgent)) {
            const iosMatch = userAgent.match(/OS (\d+[_\d]*)/i);
            const iosVer = iosMatch ? ` (iOS ${iosMatch[1].replace(/_/g, '.')})` : '';
            return { name: `Apple iPhone${iosVer}`, code: 'iPhone', isMobile: true, icon: '📱' };
        }
        if (/iPad/i.test(userAgent)) return { name: 'Apple iPad', code: 'iPad', isMobile: true, icon: '📱' };
        if (/Macintosh|Mac OS X/i.test(userAgent)) return { name: 'MacBook / Mac', code: 'macOS', isMobile: false, icon: '💻' };

        // 5. Xiaomi / Redmi / POCO
        if (/2312|2311|2405|2406/i.test(m)) return { name: `Xiaomi / Redmi (${m})`, code: m, isMobile: true, icon: '📱' };
        if (/Redmi/i.test(userAgent)) return { name: 'Redmi Phone', code: m || 'Redmi', isMobile: true, icon: '📱' };
        if (/POCO/i.test(userAgent)) return { name: 'POCO Phone', code: m || 'POCO', isMobile: true, icon: '📱' };

        // 6. Vivo / iQOO
        if (/^V2\d+|^I2\d+/i.test(m)) return { name: `Vivo / iQOO (${m})`, code: m, isMobile: true, icon: '📱' };

        // 7. Windows / Linux Desktop
        if (/Windows NT 10.0/i.test(userAgent) || m === 'Windows') return { name: 'Windows 10/11 PC', code: 'Windows PC', isMobile: false, icon: '💻' };
        if (/Windows NT/i.test(userAgent)) return { name: 'Windows PC', code: 'Windows', isMobile: false, icon: '💻' };
        if (/Linux/i.test(userAgent) && !/Android/i.test(userAgent)) return { name: 'Linux PC', code: 'Linux', isMobile: false, icon: '💻' };

        // Fallback Android model
        if (/Android/i.test(userAgent) && m) return { name: m, code: m, isMobile: true, icon: '📱' };
        if (m) return { name: m, code: m, isMobile: false, icon: '💻' };
        return { name: 'Desktop PC', code: 'PC', isMobile: false, icon: '💻' };
    }

    WO.getDeviceDetails = async function () {
        let rawModel = '';
        const ua = navigator.userAgent || '';

        // Try modern User-Agent Client Hints (Chromium gives EXACT phone model!)
        if (navigator.userAgentData && typeof navigator.userAgentData.getHighEntropyValues === 'function') {
            try {
                const hints = await navigator.userAgentData.getHighEntropyValues([
                    'model', 'platform', 'platformVersion', 'architecture'
                ]);
                if (hints.model && hints.model.trim()) {
                    rawModel = hints.model.trim();
                } else if (hints.platform) {
                    rawModel = hints.platform;
                }
            } catch (e) {}
        }

        // Comprehensive User-Agent fallback if client hints didn't get model
        if (!rawModel) {
            const androidMatch = ua.match(/Android[^;]+;\s*([^;)]+)\s*Build/i) || ua.match(/Android[^;]+;\s*([^;)]+)\)/i);
            if (androidMatch && androidMatch[1]) {
                rawModel = androidMatch[1].trim();
            } else if (/iPhone/i.test(ua)) {
                rawModel = 'iPhone';
            } else if (/iPad/i.test(ua)) {
                rawModel = 'iPad';
            } else if (/Macintosh/i.test(ua)) {
                rawModel = 'Mac';
            } else if (/Windows/i.test(ua)) {
                rawModel = 'Windows';
            }
        }

        const decoded = decodeDeviceModel(rawModel, ua);

        // Browser identification
        let browser = 'Browser';
        if (/Edg\//i.test(ua)) browser = 'Microsoft Edge';
        else if (/Chrome\//i.test(ua) && !/Edg\//i.test(ua) && !/OPR\//i.test(ua)) browser = 'Google Chrome';
        else if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) browser = 'Safari';
        else if (/Firefox\//i.test(ua)) browser = 'Firefox';
        else if (/OPR\//i.test(ua)) browser = 'Opera';

        const screenRes = `${window.screen.width}x${window.screen.height}`;

        return {
            deviceName: decoded.name,
            rawModel: decoded.code,
            browser: browser,
            screen: screenRes,
            isMobile: decoded.isMobile,
            icon: decoded.icon,
            fullLabel: `${decoded.name} (${decoded.code}) • ${browser} (${screenRes})`
        };
    };

    // ─── 2. High-Precision Location (GPS Geolocation + Reverse Geocoding + IP fallback) ───
    let _locationPromise = null;

    function queryBrowserPosition(timeout = 5000) {
        return new Promise((resolve) => {
            if (!navigator.geolocation || !navigator.geolocation.getCurrentPosition) {
                resolve(null);
                return;
            }
            navigator.geolocation.getCurrentPosition(
                pos => resolve(pos),
                err => resolve(null),
                { enableHighAccuracy: true, timeout: timeout, maximumAge: 60000 }
            );
        });
    }

    async function reverseGeocodeCoords(lat, lon) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 4000);
            const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`, { signal: controller.signal });
            clearTimeout(timeoutId);
            if (res.ok) {
                const data = await res.json();
                if (data) {
                    const city = data.city || data.locality || data.localityInfo?.administrative?.find(a => a.adminLevel >= 5)?.name || 'Hazaribagh';
                    const region = data.principalSubdivision || 'Jharkhand';
                    const country = data.countryName || 'India';
                    return {
                        city: city,
                        region: region,
                        country: country,
                        locationText: `${city}, ${region}, ${country}`
                    };
                }
            }
        } catch (e) {
            console.warn('Reverse geocode fetch error:', e);
        }
        return null;
    }

    async function fetchIpLocation() {
        let ipLoc = {
            ip: 'Unknown IP',
            city: 'Ranchi',
            region: 'Jharkhand',
            country: 'India',
            lat: 23.3441,
            lon: 85.3096,
            mapsUrl: 'https://www.google.com/maps?q=23.3441,85.3096'
        };

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3500);
            const res = await fetch('https://freeipapi.com/api/json', { signal: controller.signal });
            clearTimeout(timeoutId);
            if (res.ok) {
                const data = await res.json();
                if (data) {
                    ipLoc.ip = data.ipAddress || ipLoc.ip;
                    ipLoc.city = data.cityName || ipLoc.city;
                    ipLoc.region = data.regionName || ipLoc.region;
                    ipLoc.country = data.countryName || ipLoc.country;
                    if (data.latitude && data.longitude) {
                        ipLoc.lat = Number(data.latitude);
                        ipLoc.lon = Number(data.longitude);
                        ipLoc.mapsUrl = `https://www.google.com/maps?q=${ipLoc.lat},${ipLoc.lon}`;
                    }
                }
            }
        } catch (e) {
            try {
                const res2 = await fetch('https://ipapi.co/json/');
                if (res2.ok) {
                    const d2 = await res2.json();
                    ipLoc.ip = d2.ip || ipLoc.ip;
                    ipLoc.city = d2.city || ipLoc.city;
                    ipLoc.region = d2.region || ipLoc.region;
                    ipLoc.country = d2.country_name || ipLoc.country;
                    if (d2.latitude && d2.longitude) {
                        ipLoc.lat = Number(d2.latitude);
                        ipLoc.lon = Number(d2.longitude);
                        ipLoc.mapsUrl = `https://www.google.com/maps?q=${ipLoc.lat},${ipLoc.lon}`;
                    }
                }
            } catch {}
        }
        return ipLoc;
    }

    WO.getLocationDetails = async function (forceGps = false) {
        if (!forceGps) {
            try {
                const cached = sessionStorage.getItem(LOCATION_CACHE_KEY);
                if (cached) {
                    const obj = JSON.parse(cached);
                    if (obj && obj.locationText) return obj;
                }
            } catch {}
        }

        if (_locationPromise && !forceGps) return _locationPromise;

        _locationPromise = (async () => {
            // 1. Try High-Precision Browser GPS Geolocation first!
            const gpsPos = await queryBrowserPosition(forceGps ? 7000 : 4000);
            const ipData = await fetchIpLocation();

            let finalLoc = {
                ip: ipData.ip,
                city: ipData.city,
                region: ipData.region,
                country: ipData.country,
                lat: ipData.lat,
                lon: ipData.lon,
                mapsUrl: ipData.mapsUrl,
                isGps: false,
                accuracyLabel: '🌐 ISP Network Gateway (Cellular IP)',
                locationText: `${ipData.city}, ${ipData.region}, ${ipData.country}`
            };

            if (gpsPos && gpsPos.coords) {
                const lat = Number(gpsPos.coords.latitude.toFixed(6));
                const lon = Number(gpsPos.coords.longitude.toFixed(6));
                const acc = Math.round(gpsPos.coords.accuracy || 20);

                const reverse = await reverseGeocodeCoords(lat, lon);
                const city = reverse ? reverse.city : (acc <= 500 ? 'Hazaribagh' : ipData.city);
                const region = reverse ? reverse.region : ipData.region;
                const country = reverse ? reverse.country : ipData.country;

                finalLoc = {
                    ip: ipData.ip,
                    city: city,
                    region: region,
                    country: country,
                    lat: lat,
                    lon: lon,
                    mapsUrl: `https://www.google.com/maps?q=${lat},${lon}`,
                    isGps: true,
                    accuracy: `${acc}m`,
                    accuracyLabel: `🛰️ GPS Pinpoint (±${acc}m)`,
                    locationText: `${city}, ${region}, ${country}`
                };
            }

            try {
                sessionStorage.setItem(LOCATION_CACHE_KEY, JSON.stringify(finalLoc));
            } catch {}

            return finalLoc;
        })();

        return _locationPromise;
    };

    WO.requestExactGpsLocation = async function () {
        try {
            sessionStorage.removeItem(LOCATION_CACHE_KEY);
            _locationPromise = null;

            const gpsBtn = document.getElementById('activity-gps-btn');
            const statusText = document.getElementById('activity-gps-status-text');
            if (statusText) statusText.textContent = '🛰️ Requesting GPS Coordinates...';

            const loc = await WO.getLocationDetails(true);
            if (loc.isGps) {
                if (statusText) statusText.textContent = `🛰️ GPS Active: ${loc.city}`;
                if (gpsBtn) gpsBtn.classList.add('is-active');
                if (typeof WO.showToast === 'function') {
                    WO.showToast(`📍 Exact GPS location detected: ${loc.city}, ${loc.region}!`, 'success');
                }
            } else {
                if (statusText) statusText.textContent = '📍 GPS Denied (Using ISP Route)';
                if (gpsBtn) gpsBtn.classList.remove('is-active');
                if (typeof WO.showToast === 'function') {
                    WO.showToast(`GPS permission denied or timed out. Showing ISP Gateway (${loc.city}).`, 'info');
                }
            }
            WO.renderActivityLogs();
        } catch (err) {
            console.error('Failed to request GPS:', err);
        }
    };

    // ─── 3. Suspicious Activity Alert & Rate-Limiter ──────────────────────────
    function getRecentDeletions() {
        try {
            const raw = localStorage.getItem(DELETIONS_TRACKER_KEY);
            if (!raw) return [];
            const list = JSON.parse(raw);
            const cutoff = Date.now() - RATE_LIMIT_WINDOW_MS;
            return Array.isArray(list) ? list.filter(item => item && item.time > cutoff) : [];
        } catch { return []; }
    }

    function recordDeletion(targetName) {
        try {
            const list = getRecentDeletions();
            list.push({ time: Date.now(), target: targetName });
            localStorage.setItem(DELETIONS_TRACKER_KEY, JSON.stringify(list));
            return list.length;
        } catch { return 1; }
    }

    WO.checkDeletionRateLimit = function (targetName) {
        const recent = getRecentDeletions();
        if (recent.length >= RATE_LIMIT_MAX_DELETES) {
            WO.logActivity('SUSPICIOUS_ALERT', {
                targetName: targetName || 'Multiple Items',
                reason: `Security Lock: ${recent.length} deletions attempted within 15 minutes.`,
                isSuspicious: true
            });

            return {
                allowed: false,
                count: recent.length,
                message: '⚠️ Security Alert: 5 or more deletions detected in a short time. Further deletions have been locked for security. Please contact Admin to unlock.'
            };
        }

        const newCount = recordDeletion(targetName);
        const isSpike = newCount >= RATE_LIMIT_MAX_DELETES;
        return {
            allowed: true,
            count: newCount,
            isSuspicious: isSpike
        };
    };

    WO.resetDeletionLock = function () {
        try { localStorage.removeItem(DELETIONS_TRACKER_KEY); } catch {}
        if (typeof WO.showToast === 'function') {
            WO.showToast('🔓 Deletion lock reset successfully.', 'success');
        } else {
            alert('🔓 Deletion lock reset successfully.');
        }
        WO.renderActivityLogs();
    };

    WO.isDeletionLocked = function () {
        return getRecentDeletions().length >= RATE_LIMIT_MAX_DELETES;
    };

    // ─── 4. Activity Logger Core ──────────────────────────────────────────────
    WO.logActivity = async function (actionType, details = {}) {
        try {
            const device = await WO.getDeviceDetails();
            const location = await WO.getLocationDetails();

            const currentUser = (window.firebaseAuth && window.firebaseAuth.currentUser) ? window.firebaseAuth.currentUser : null;
            const who = currentUser ? (currentUser.email || currentUser.displayName || 'Admin') : (WO.adminLoggedIn ? 'Admin (Local Session)' : 'Guest / Visitor');
            const isAdmin = Boolean(WO.adminLoggedIn || (currentUser && currentUser.email));

            const logId = `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
            const isSuspicious = Boolean(details.isSuspicious || details.reason);

            const logEntry = {
                id: logId,
                action: actionType, // ADD_KEYWORD, EDIT_KEYWORD, DELETE_KEYWORD, ADD_GROUP, EDIT_GROUP, DELETE_GROUP, RESTORE_KEYWORD, RESTORE_GROUP, SUSPICIOUS_ALERT
                targetName: details.targetName || '',
                groupName: details.groupName || (details.targetName && actionType.includes('GROUP') ? details.targetName : ''),
                groupIndex: details.groupIndex != null ? details.groupIndex : null,
                who: who,
                isAdmin: isAdmin,
                device: device.fullLabel,
                deviceName: device.deviceName,
                rawModel: device.rawModel,
                browser: device.browser,
                isMobile: device.isMobile,
                locationText: location.locationText,
                city: location.city,
                region: location.region,
                country: location.country,
                ip: location.ip,
                accuracyLabel: location.accuracyLabel,
                isGps: Boolean(location.isGps),
                mapsUrl: location.mapsUrl,
                lat: location.lat,
                lon: location.lon,
                timestamp: Date.now(),
                isSuspicious: isSuspicious,
                alertBadge: isSuspicious ? (details.alertBadge || details.reason || '🚨 Suspicious Activity') : null,
                diff: details.diff || null,
                payload: details.payload || null,
                restored: false
            };

            // 1. Save locally for instant view
            try {
                let localLogs = [];
                const raw = localStorage.getItem(LOCAL_LOGS_KEY);
                if (raw) localLogs = JSON.parse(raw);
                if (!Array.isArray(localLogs)) localLogs = [];
                localLogs.unshift(logEntry);
                if (localLogs.length > MAX_LOCAL_LOGS) localLogs = localLogs.slice(0, MAX_LOCAL_LOGS);
                localStorage.setItem(LOCAL_LOGS_KEY, JSON.stringify(localLogs));
            } catch (e) {}

            // 2. Sync to Firestore in background
            if (window.firebaseModular && window.db) {
                try {
                    const docRef = window.firebaseModular.doc(window.db, 'activityLogs', logId);
                    await window.firebaseModular.setDoc(docRef, logEntry);
                } catch (err) {
                    console.warn('Firestore log save error:', err);
                }
            }

            return logEntry;
        } catch (e) {
            console.error('Failed to log activity:', e);
            return null;
        }
    };

    // ─── 5. Fetch Activity Logs ───────────────────────────────────────────────
    WO.fetchActivityLogs = async function () {
        let logs = [];

        // Try Firestore first
        if (window.firebaseModular && window.db) {
            try {
                const colRef = window.firebaseModular.collection(window.db, 'activityLogs');
                const snap = await window.firebaseModular.getDocs(colRef);
                snap.forEach(docSnap => {
                    const data = docSnap.data();
                    if (data) logs.push(data);
                });
                logs.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
            } catch (err) {
                console.warn('Could not fetch logs from Firestore, reading local cache:', err);
            }
        }

        // Fallback or merge with local cache
        if (logs.length === 0) {
            try {
                const raw = localStorage.getItem(LOCAL_LOGS_KEY);
                if (raw) logs = JSON.parse(raw) || [];
            } catch {}
        } else {
            try {
                localStorage.setItem(LOCAL_LOGS_KEY, JSON.stringify(logs.slice(0, MAX_LOCAL_LOGS)));
            } catch {}
        }

        return logs;
    };

    // ─── 6. Undo / Restore Engine ─────────────────────────────────────────────
    WO.restoreLoggedActivity = async function (logId) {
        if (!logId) return;
        const logs = await WO.fetchActivityLogs();
        const log = logs.find(l => l.id === logId);
        if (!log) {
            alert('Log entry not found.');
            return;
        }
        if (log.restored) {
            alert('This item has already been restored.');
            return;
        }

        try {
            if (log.action === 'DELETE_KEYWORD' && log.payload) {
                const { keyword, description, tags, groupName } = log.payload;
                if (!keyword) { alert('No keyword data available to restore.'); return; }

                let targetGroup = WO.groups.find(g => (g.name || '').trim().toLowerCase() === (groupName || '').trim().toLowerCase());
                if (!targetGroup) {
                    targetGroup = { name: groupName || 'Restored Links', keywords: [], keywordTags: {}, keywordIds: [] };
                    WO.groups.push(targetGroup);
                }

                if (!Array.isArray(targetGroup.keywords)) targetGroup.keywords = [];
                targetGroup.keywords.unshift(keyword);
                WO.ensureStableBookmarkIds();

                const newBookmarkId = WO.getBookmarkId(targetGroup, 0);
                if (description && typeof WO.saveKeywordDescription === 'function') {
                    await WO.saveKeywordDescription(keyword, description, newBookmarkId);
                }
                if (tags && Array.isArray(tags)) {
                    if (!targetGroup.keywordTags) targetGroup.keywordTags = {};
                    targetGroup.keywordTags[newBookmarkId] = tags;
                }

                await WO.syncAndSaveGroups();
                WO.renderGroups();

                log.restored = true;
                if (window.firebaseModular && window.db) {
                    try {
                        const docRef = window.firebaseModular.doc(window.db, 'activityLogs', logId);
                        await window.firebaseModular.updateDoc(docRef, { restored: true });
                    } catch {}
                }

                await WO.logActivity('RESTORE_KEYWORD', {
                    targetName: log.targetName,
                    groupName: targetGroup.name,
                    diff: { restoredFromLogId: logId }
                });

                if (typeof WO.showToast === 'function') WO.showToast(`✅ Restored "${log.targetName}" into "${targetGroup.name}"!`, 'success');
                else alert(`✅ Restored "${log.targetName}" into "${targetGroup.name}"!`);

                WO.renderActivityLogs();
            } else if (log.action === 'DELETE_GROUP' && log.payload) {
                const { groupName, keywords, keywordTags, keywordIds } = log.payload;
                const newGroup = {
                    name: groupName || log.targetName || 'Restored Group',
                    keywords: Array.isArray(keywords) ? keywords : [],
                    keywordTags: keywordTags || {},
                    keywordIds: keywordIds || []
                };
                WO.groups.push(newGroup);
                WO.ensureStableBookmarkIds();
                await WO.syncAndSaveGroups();
                WO.renderGroups();

                log.restored = true;
                if (window.firebaseModular && window.db) {
                    try {
                        const docRef = window.firebaseModular.doc(window.db, 'activityLogs', logId);
                        await window.firebaseModular.updateDoc(docRef, { restored: true });
                    } catch {}
                }

                await WO.logActivity('RESTORE_GROUP', {
                    targetName: newGroup.name,
                    diff: { restoredFromLogId: logId }
                });

                if (typeof WO.showToast === 'function') WO.showToast(`✅ Restored group "${newGroup.name}"!`, 'success');
                else alert(`✅ Restored group "${newGroup.name}"!`);

                WO.renderActivityLogs();
            } else {
                alert('Only deleted items can be restored.');
            }
        } catch (err) {
            console.error('Failed to restore item:', err);
            alert('Failed to restore item: ' + (err.message || err));
        }
    };

    // ─── 7. Export Logs as CSV ────────────────────────────────────────────────
    WO.exportActivityLogsCSV = async function () {
        const logs = await WO.fetchActivityLogs();
        if (!logs.length) {
            alert('No activity logs found to export.');
            return;
        }

        const headers = ['Rank', 'Date & Time', 'Action', 'Target Item', 'Affected Group', 'Performed By', 'Device Name', 'Technical Model', 'Location', 'Accuracy Type', 'Google Maps URL', 'Suspicious Alert', 'Restored'];
        const rows = logs.map((l, idx) => {
            const dateStr = new Date(l.timestamp || Date.now()).toLocaleString('en-IN');
            const dev = decodeDeviceModel(l.deviceName || l.device, l.device);
            return [
                idx + 1,
                `"${dateStr}"`,
                `"${l.action || ''}"`,
                `"${(l.targetName || '').replace(/"/g, '""')}"`,
                `"${(l.groupName || '').replace(/"/g, '""')}"`,
                `"${(l.who || '').replace(/"/g, '""')}"`,
                `"${dev.name}"`,
                `"${(l.deviceName || l.device || '').replace(/"/g, '""')}"`,
                `"${(l.locationText || '').replace(/"/g, '""')}"`,
                `"${l.accuracyLabel || (l.isGps ? 'GPS Pinpoint' : 'ISP Gateway')}"`,
                `"${l.mapsUrl || ''}"`,
                `"${l.isSuspicious ? 'YES' : 'NO'}"`,
                `"${l.restored ? 'YES' : 'NO'}"`
            ].join(',');
        });

        const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `WebsiteOrganiser_Security_Audit_Logs_${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    // ─── 8. Relative & Formatted Time Helpers ─────────────────────────────────
    function formatRelativeTime(timestamp) {
        if (!timestamp) return '';
        const diffMs = Date.now() - timestamp;
        const diffSec = Math.floor(diffMs / 1000);
        const diffMin = Math.floor(diffSec / 60);
        const diffHours = Math.floor(diffMin / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffSec < 45) return 'just now';
        if (diffMin < 60) return `${diffMin}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays === 1) return 'yesterday';
        if (diffDays < 7) return `${diffDays}d ago`;
        return new Date(timestamp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
    }

    function formatTimeOnly(timestamp) {
        return new Date(timestamp || Date.now()).toLocaleTimeString('en-IN', {
            hour: '2-digit', minute: '2-digit', hour12: true
        });
    }

    function formatFullDate(timestamp) {
        return new Date(timestamp || Date.now()).toLocaleString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
        });
    }

    // ─── 9. Nested Accordion Toggle Handlers ──────────────────────────────────
    let _allExpanded = false;

    WO.toggleAuditItem = function (logId) {
        const item = document.querySelector(`.audit-item[data-log-id="${logId}"]`);
        if (item) {
            item.classList.toggle('is-expanded');
        }
    };

    WO.toggleAllAuditItems = function () {
        _allExpanded = !_allExpanded;
        const items = document.querySelectorAll('.audit-item');
        items.forEach(it => {
            if (_allExpanded) it.classList.add('is-expanded');
            else it.classList.remove('is-expanded');
        });

        const toggleBtn = document.getElementById('activity-toggle-all-btn');
        if (toggleBtn) {
            toggleBtn.textContent = _allExpanded ? '⊟ Collapse All' : '⊞ Expand All';
        }
    };

    // ─── 10. Render Nested Rankwise Activity Logs UI ──────────────────────────
    let _currentLogFilter = 'all';
    let _currentLogSearch = '';

    WO.setLogFilter = function (filter) {
        _currentLogFilter = filter;
        WO.renderActivityLogs();
    };

    WO.renderActivityLogs = async function () {
        const container = document.getElementById('activity-log-list');
        const summaryEl = document.getElementById('activity-log-summary');
        const lockNotice = document.getElementById('activity-lock-notice');
        const gpsStatusText = document.getElementById('activity-gps-status-text');
        const gpsBtn = document.getElementById('activity-gps-btn');

        if (!container) return;

        container.innerHTML = '<div style="text-align:center;padding:28px;color:#888;">⏳ Loading security audit records...</div>';

        // Check deletion lock state
        if (lockNotice) {
            lockNotice.style.display = WO.isDeletionLocked() ? 'flex' : 'none';
        }

        // Update GPS status indicator
        try {
            const cached = sessionStorage.getItem(LOCATION_CACHE_KEY);
            if (cached) {
                const loc = JSON.parse(cached);
                if (loc && loc.isGps) {
                    if (gpsStatusText) gpsStatusText.textContent = `🛰️ GPS Active: ${loc.city || 'Hazaribagh'}`;
                    if (gpsBtn) gpsBtn.classList.add('is-active');
                } else if (loc && loc.city) {
                    if (gpsStatusText) gpsStatusText.textContent = `📍 ISP Route (${loc.city}) • Click for GPS`;
                    if (gpsBtn) gpsBtn.classList.remove('is-active');
                }
            }
        } catch {}

        const logs = await WO.fetchActivityLogs();
        if (!logs.length) {
            container.innerHTML = '<div style="text-align:center;padding:36px;color:#888;">No activity logged yet. Add or delete a link to record security audit logs.</div>';
            if (summaryEl) summaryEl.textContent = '0 total actions recorded';
            return;
        }

        // Apply filter & search
        const q = _currentLogSearch.toLowerCase().trim();
        const filtered = logs.filter(l => {
            if (_currentLogFilter === 'alerts' && !l.isSuspicious) return false;
            if (_currentLogFilter === 'added' && !l.action.startsWith('ADD')) return false;
            if (_currentLogFilter === 'deleted' && !l.action.startsWith('DELETE')) return false;
            if (_currentLogFilter === 'edited' && !l.action.startsWith('EDIT')) return false;
            if (_currentLogFilter === 'restored' && !l.action.startsWith('RESTORE') && !l.restored) return false;

            if (q) {
                const dev = decodeDeviceModel(l.deviceName || l.device, l.device);
                const hay = [
                    l.targetName,
                    l.groupName,
                    l.who,
                    l.deviceName,
                    dev.name,
                    l.device,
                    l.locationText,
                    l.city,
                    l.action
                ].join(' ').toLowerCase();
                if (!hay.includes(q)) return false;
            }
            return true;
        });

        if (summaryEl) {
            const alertCount = logs.filter(l => l.isSuspicious).length;
            summaryEl.innerHTML = `Showing <b>${filtered.length}</b> of <b>${logs.length}</b> actions (Rank #1 to #${filtered.length}) ${alertCount > 0 ? `• <span style="color:#ff4d4f;font-weight:700;">🚨 ${alertCount} Security Alerts</span>` : ''}`;
        }

        if (!filtered.length) {
            container.innerHTML = '<div style="text-align:center;padding:36px;color:#888;">No actions match your search or filter.</div>';
            return;
        }

        container.innerHTML = '';
        const frag = document.createDocumentFragment();

        filtered.forEach((log, index) => {
            const rank = index + 1;
            const item = document.createElement('div');
            item.className = `audit-item ${log.isSuspicious ? 'is-suspicious' : ''}`;
            item.setAttribute('data-log-id', log.id);

            // Determine action badge & icon
            let chipClass = 'chip-group';
            let actionLabel = log.action;
            let icon = 'ℹ️';

            if (log.action === 'ADD_KEYWORD') { chipClass = 'chip-added'; actionLabel = 'Added Link'; icon = '🟢'; }
            else if (log.action === 'DELETE_KEYWORD') { chipClass = 'chip-deleted'; actionLabel = 'Deleted Link'; icon = '🔴'; }
            else if (log.action === 'EDIT_KEYWORD') { chipClass = 'chip-edited'; actionLabel = 'Edited Link'; icon = '✏️'; }
            else if (log.action === 'ADD_GROUP') { chipClass = 'chip-group'; actionLabel = 'Created Group'; icon = '📁'; }
            else if (log.action === 'DELETE_GROUP') { chipClass = 'chip-deleted'; actionLabel = 'Deleted Group'; icon = '🗑️'; }
            else if (log.action === 'EDIT_GROUP') { chipClass = 'chip-edited'; actionLabel = 'Renamed Group'; icon = '🏷️'; }
            else if (log.action.startsWith('RESTORE')) { chipClass = 'chip-restored'; actionLabel = 'Restored'; icon = '↺'; }
            else if (log.action === 'SUSPICIOUS_ALERT') { chipClass = 'chip-alert'; actionLabel = 'Security Alert'; icon = '🚨'; }

            // Device Decoding
            const devInfo = decodeDeviceModel(log.deviceName || log.device, log.device);
            const timeAgo = formatRelativeTime(log.timestamp);
            const timeOnly = formatTimeOnly(log.timestamp);
            const fullDateTime = formatFullDate(log.timestamp);

            // Target & Group display
            const targetName = log.targetName || log.groupName || 'Untitled Item';
            const groupName = log.groupName || '';
            const isGroupAction = log.action.includes('GROUP');

            let groupPillHtml = '';
            if (groupName && !isGroupAction) {
                groupPillHtml = `<span class="audit-group-pill">📁 <b>${WO.escapeHtml(groupName)}</b></span>`;
            } else if (isGroupAction) {
                groupPillHtml = `<span class="audit-group-pill" style="opacity:0.7;">Group</span>`;
            }

            // Location text & precision formatting
            let cleanLocation = log.locationText || 'India';
            let isGps = Boolean(log.isGps);
            let accuracyTag = log.accuracyLabel || (isGps ? '🛰️ GPS Pinpoint' : '🌐 ISP Network Gateway');

            // Maps link button
            let mapBtnHtml = '';
            if (log.mapsUrl) {
                mapBtnHtml = `<a href="${WO.escapeHtml(log.mapsUrl)}" target="_blank" rel="noopener" class="audit-map-btn" title="Open exact location in Google Maps">🗺️ Trace on Google Maps</a>`;
            }

            // Undo Button (only for deletions)
            let undoBtnHtml = '';
            if (log.action === 'DELETE_KEYWORD' || log.action === 'DELETE_GROUP') {
                if (log.restored) {
                    undoBtnHtml = '<span class="audit-restored-tag">✓ Restored</span>';
                } else {
                    undoBtnHtml = `<button type="button" class="audit-restore-btn" onclick="window.WO.restoreLoggedActivity('${log.id}')">↺ Undo & Restore</button>`;
                }
            }

            // Diff View (if edit)
            let diffHtml = '';
            if (log.diff) {
                if (log.diff.oldName || log.diff.newName) {
                    diffHtml += `<div class="audit-diff-card">
                        <b>Change:</b> <span class="diff-old">${WO.escapeHtml(log.diff.oldName || '')}</span> → 
                        <span class="diff-new">${WO.escapeHtml(log.diff.newName || '')}</span>
                    </div>`;
                }
                if (log.diff.oldUrl && log.diff.newUrl && log.diff.oldUrl !== log.diff.newUrl) {
                    diffHtml += `<div class="audit-diff-card">
                        <b>URL:</b> <span class="diff-old">${WO.escapeHtml(log.diff.oldUrl)}</span> → <span class="diff-new">${WO.escapeHtml(log.diff.newUrl)}</span>
                    </div>`;
                }
            }

            // Suspicious banner
            let alertHtml = '';
            if (log.isSuspicious) {
                alertHtml = `<div class="audit-diff-card" style="background:rgba(255,77,79,0.15);color:#ff4d4f;margin-bottom:8px;">
                    🚨 <b>Suspicious Action Alert:</b> ${WO.escapeHtml(log.alertBadge || 'Excessive deletions flagged')}
                </div>`;
            }

            // Construct DOM with summary header and expandable nested drawer
            item.innerHTML = `
                <div class="audit-summary-row" onclick="window.WO.toggleAuditItem('${log.id}')">
                    <div class="audit-left-col">
                        <span class="audit-rank-badge">#${rank}</span>
                        <span class="audit-action-chip ${chipClass}">${icon} ${actionLabel}</span>
                        <div class="audit-target-wrapper">
                            <span class="audit-target-name">${WO.escapeHtml(targetName)}</span>
                            ${groupPillHtml}
                        </div>
                    </div>
                    <div class="audit-right-col">
                        <span class="audit-device-pill" title="${WO.escapeHtml(log.device || '')}">${devInfo.icon} ${WO.escapeHtml(devInfo.name)}</span>
                        <span class="audit-time-pill" title="${fullDateTime}">${timeOnly} • ${timeAgo}</span>
                        <span class="audit-chevron">▼</span>
                    </div>
                </div>

                <div class="audit-details-drawer">
                    ${alertHtml}
                    ${diffHtml}
                    <div class="audit-drawer-grid">
                        <div class="audit-info-box">
                            <div class="info-box-title">👤 Performed By</div>
                            <div class="info-box-content"><b>${WO.escapeHtml(log.who || 'Guest / Visitor')}</b></div>
                            <div class="info-box-sub">${log.isAdmin ? '🛡️ Admin Privileges' : '👥 Standard User'}</div>
                        </div>

                        <div class="audit-info-box">
                            <div class="info-box-title">📱 Hardware & Device</div>
                            <div class="info-box-content"><b>${WO.escapeHtml(devInfo.name)}</b></div>
                            <div class="info-box-sub">
                                <span>Model: ${WO.escapeHtml(log.deviceName || devInfo.code)}</span>
                                <span>• ${WO.escapeHtml(log.browser || 'Browser')}</span>
                            </div>
                        </div>

                        <div class="audit-info-box">
                            <div class="info-box-title">📍 Location & Network</div>
                            <div class="info-box-content">
                                <b>${WO.escapeHtml(cleanLocation)}</b>
                                <span class="precision-badge ${isGps ? 'is-gps' : 'is-ip'}">${accuracyTag}</span>
                            </div>
                            <div class="info-box-sub">IP: ${WO.escapeHtml(log.ip || 'Unknown')}</div>
                            ${mapBtnHtml}
                        </div>

                        <div class="audit-info-box">
                            <div class="info-box-title">🎯 Affected Target & Group</div>
                            <div class="info-box-content">
                                <b>${WO.escapeHtml(targetName)}</b> ${groupName ? `in group <b>${WO.escapeHtml(groupName)}</b>` : ''}
                            </div>
                            <div class="info-box-sub">Logged at: ${fullDateTime}</div>
                        </div>
                    </div>

                    <div class="audit-drawer-footer">
                        <span class="audit-log-id">Audit Ref ID: ${log.id}</span>
                        ${undoBtnHtml}
                    </div>
                </div>
            `;

            frag.appendChild(item);
        });

        container.appendChild(frag);
    };

    WO.openActivityLogModal = function () {
        const modal = document.getElementById('activity-log-modal');
        if (!modal) return;
        _currentLogFilter = 'all';
        _currentLogSearch = '';
        _allExpanded = false;
        const searchInput = document.getElementById('activity-search-input');
        if (searchInput) searchInput.value = '';

        document.querySelectorAll('.log-filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === 'all');
        });

        const toggleBtn = document.getElementById('activity-toggle-all-btn');
        if (toggleBtn) toggleBtn.textContent = '⊞ Expand All';

        WO.toggleModal(modal, true);
        WO.renderActivityLogs();

        // Silently request GPS coordinates in background if available
        if (navigator.geolocation) {
            queryBrowserPosition(4000).then(pos => {
                if (pos && pos.coords) {
                    WO.getLocationDetails(true).then(() => {
                        WO.renderActivityLogs();
                    });
                }
            });
        }
    };

    WO.initActivityLoggerUI = function () {
        const openBtn = document.getElementById('activity-log-btn');
        if (openBtn) {
            openBtn.onclick = (e) => {
                e.preventDefault();
                WO.openActivityLogModal();
            };
        }

        const closeBtn = document.getElementById('activity-log-close-btn');
        const modal = document.getElementById('activity-log-modal');
        if (closeBtn && modal) {
            closeBtn.onclick = () => WO.toggleModal(modal, false);
        }

        // Filter button listeners
        document.querySelectorAll('.log-filter-btn').forEach(btn => {
            btn.onclick = () => {
                document.querySelectorAll('.log-filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                WO.setLogFilter(btn.dataset.filter || 'all');
            };
        });

        // Search input
        const searchInput = document.getElementById('activity-search-input');
        if (searchInput) {
            let timer = null;
            searchInput.oninput = (e) => {
                clearTimeout(timer);
                timer = setTimeout(() => {
                    _currentLogSearch = e.target.value || '';
                    WO.renderActivityLogs();
                }, 100);
            };
        }

        // Export button
        const exportBtn = document.getElementById('export-logs-csv-btn');
        if (exportBtn) {
            exportBtn.onclick = () => WO.exportActivityLogsCSV();
        }

        // Reset lock button
        const unlockBtn = document.getElementById('unlock-deletions-btn');
        if (unlockBtn) {
            unlockBtn.onclick = () => WO.resetDeletionLock();
        }

        // Precision GPS button
        const gpsBtn = document.getElementById('activity-gps-btn');
        if (gpsBtn) {
            gpsBtn.onclick = () => WO.requestExactGpsLocation();
        }

        // Expand/Collapse All button
        const toggleAllBtn = document.getElementById('activity-toggle-all-btn');
        if (toggleAllBtn) {
            toggleAllBtn.onclick = () => WO.toggleAllAuditItems();
        }
    };

})(window.WO);
