(function(WO) {
    const defaults = { hoverSound:true, clickSound:true, volume:55, hoverTone:'soft', clickTone:'digital', hoverVolume:15, clickVolume:100, hoverCooldown:90, showClock:true, showSeconds:false, clockFormat:'12', glass:true, reducedMotion:false, showTagline:true, accent:'purple', tileSize:'default', tileSpacing:'default', tileCorners:'rounded', hoverEffect:'default', showCategoryIcons:true };
    const choices = { hoverTone:['soft','bell','pop','crystal','wood','digital'], clickTone:['soft','bell','pop','crystal','wood','digital'], clockFormat:['12','24'], accent:['purple','blue','pink','teal','orange'], tileSize:['compact','default','large'], tileSpacing:['tight','default','airy'], tileCorners:['rounded','soft','square'], hoverEffect:['default','lift','glow','none'] };
    const ranges = { volume:[0,100], hoverVolume:[0,100], clickVolume:[0,100], hoverCooldown:[50,500] };
    const form = document.getElementById('preferences-form');
    const dialog = document.getElementById('preferences-dialog');
    const trigger = document.getElementById('preferences-button');
    const names = { soft:'Soft tap', bell:'Warm bell', pop:'Bubble pop', crystal:'Crystal chime', wood:'Wood tap', digital:'Digital beep', default:'Original', compact:'Compact', large:'Large', tight:'Tight', airy:'Airy', rounded:'Rounded', square:'Square', lift:'Lift', glow:'Glow', none:'None', purple:'Purple', blue:'Blue', pink:'Pink', teal:'Teal', orange:'Orange', '12':'12-hour', '24':'24-hour' };
    function row(key, label, description = '') {
        let control;
        if (choices[key]) control = `<select name="${key}" id="pref-${key}">${choices[key].map(value=>`<option value="${value}">${key === 'tileCorners' && value === 'soft' ? 'Soft corners' : names[value]}</option>`).join('')}</select>`;
        else if (ranges[key]) control = `<div class="preference-range"><input id="pref-${key}" name="${key}" type="range" min="${ranges[key][0]}" max="${ranges[key][1]}" step="${key === 'hoverCooldown' ? 10 : 1}"><output for="pref-${key}" data-output="${key}"></output></div>`;
        else control = `<input id="pref-${key}" name="${key}" type="checkbox" role="switch">`;
        return `<label class="preference-row" for="pref-${key}"><span>${label}${description ? `<small>${description}</small>` : ''}</span>${control}</label>`;
    }
    form.innerHTML = `<details class="preference-section" open><summary>Sound studio <span>Tones, volume & feedback</span></summary><fieldset><legend class="sr-only">Sound studio</legend>
        ${row('hoverSound','Hover sounds','Play a tone when you explore website tiles')}${row('hoverTone','Hover tone')}${row('hoverVolume','Hover volume')}
        <button type="button" class="preference-button sound-preview" data-sound="hover">▶ Preview hover tone</button>
        ${row('clickSound','Click sounds','Feedback when you open a website')}${row('clickTone','Click tone')}${row('clickVolume','Click volume')}
        <button type="button" class="preference-button sound-preview" data-sound="click">▶ Preview click tone</button>
        ${row('volume','Master volume','Scales both hover and click volume')}${row('hoverCooldown','Hover interval','Minimum time between tones while moving quickly')}
        <p class="preference-note">Previews play even when a sound toggle is off. Volume controls always apply.</p>
    </fieldset></details>
    <details class="preference-section"><summary>Look & feel <span>Color, glass & movement</span></summary><fieldset><legend class="sr-only">Look and feel</legend>
        ${row('accent','Accent color','Brand, controls and focus highlights')}${row('glass','Glass header','Soft translucent gradient')}${row('reducedMotion','Reduced motion','Minimize animations; your system preference is also respected')}
    </fieldset></details>
    <details class="preference-section"><summary>Website tiles <span>Size, spacing & hover effects</span></summary><fieldset><legend class="sr-only">Website tiles</legend>
        ${row('tileSize','Tile size')}${row('tileSpacing','Tile spacing')}${row('tileCorners','Tile corners')}${row('hoverEffect','Hover effect')}${row('showCategoryIcons','Category icons')}
    </fieldset></details>
    <details class="preference-section"><summary>Header & clock <span>Time format & little details</span></summary><fieldset><legend class="sr-only">Header and clock</legend>
        ${row('showClock','Show clock','Visible on wide screens')}${row('showSeconds','Show seconds')}${row('clockFormat','Time format')}${row('showTagline','Brand tagline')}
    </fieldset></details>
    <div class="preferences-footer"><span id="preferences-status" role="status">Saved on this device</span><button type="button" id="preferences-reset" class="preference-button">Reset defaults</button></div>`;
    function normalize(saved) {
        const result = {...defaults};
        if (!saved || typeof saved !== 'object') return result;
        for (const key of Object.keys(defaults)) {
            if (choices[key]) { if (choices[key].includes(saved[key])) result[key] = saved[key]; }
            else if (ranges[key]) { if (Number.isFinite(saved[key])) result[key] = Math.max(ranges[key][0],Math.min(ranges[key][1],saved[key])); }
            else if (typeof saved[key] === 'boolean') result[key] = saved[key];
        }
        return result;
    }
    let saved;
    try { saved = JSON.parse(localStorage.getItem('wo-preferences')); } catch {}
    WO.preferences = normalize(saved);
    function apply() {
        const p = WO.preferences, root = document.documentElement;
        for (const key of ['showClock','showSeconds','clockFormat','glass','reducedMotion','showTagline','accent','tileSize','tileSpacing','tileCorners','hoverEffect','showCategoryIcons']) root.dataset[key] = String(p[key]);
        const accents = {purple:['#9750e9','#ca9aff'],blue:['#2876d7','#82baff'],pink:['#d23e90','#ff9dcb'],teal:['#087e80','#6fe0d4'],orange:['#b96313','#ffc17e']};
        root.style.setProperty('--preference-accent', accents[p.accent][0]); root.style.setProperty('--preference-accent-light',accents[p.accent][1]);
        for (const key of Object.keys(defaults)) {
            const input = form.elements.namedItem(key);
            if (input.type === 'checkbox') input.checked = p[key]; else input.value = p[key];
        }
        form.querySelectorAll('[data-output]').forEach(output=>{ output.textContent = p[output.dataset.output] + (output.dataset.output === 'hoverCooldown' ? ' ms' : '%'); });
        form.elements.showSeconds.disabled = form.elements.clockFormat.disabled = !p.showClock;
        document.dispatchEvent(new Event('wo-preferences-changed'));
    }
    function save() {
        apply();
        try { localStorage.setItem('wo-preferences', JSON.stringify(WO.preferences)); document.getElementById('preferences-status').textContent = 'Saved on this device'; }
        catch { document.getElementById('preferences-status').textContent = 'Applied for this session'; }
    }
    trigger.addEventListener('click', () => dialog.showModal());
    document.getElementById('preferences-close').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', e => { if (e.target === dialog) { const r = dialog.getBoundingClientRect(); if(e.clientX<r.left || e.clientX>r.right || e.clientY<r.top || e.clientY>r.bottom) dialog.close(); } });
    dialog.addEventListener('close', () => trigger.focus());
    form.addEventListener('submit', e=>e.preventDefault());
    form.addEventListener('input', e=>{const input=e.target; if (!Object.hasOwn(defaults,input.name)) return; WO.preferences[input.name]= input.type==='checkbox' ? input.checked : input.type==='range' ? Number(input.value) : input.value; save();});
    document.getElementById('preferences-reset').addEventListener('click',()=>{WO.preferences={...defaults};save();});
    form.querySelectorAll('[data-sound]').forEach(button=>button.addEventListener('click',()=>{
        const played = WO.playPreferenceSound(button.dataset.sound,true);
        document.getElementById('preferences-status').textContent = played ? 'Previewing '+button.dataset.sound+' tone' : 'Increase master and tone volume to preview';
    }));
    window.addEventListener('storage',e=>{if(e.key==='wo-preferences'){try{WO.preferences=normalize(JSON.parse(e.newValue));apply();}catch{}}});
    function focusSearch(){const input=document.getElementById('google-search-input');input.focus();input.select();}
    document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'&&!dialog.open){e.preventDefault();focusSearch();}});
    apply();
})(window.WO);
