const fs = require('fs');
const cheerio = require('cheerio');

// Ye wo list hai jinki links roz change hoti hain
// Aap iss array me aur bhi sites add kar sakte ho 
const SITES_TO_SCRAPE = [
    { 
        url: 'https://hdhub4u.insure/', 
        name: 'hdhub4u',
        type: 'html'
    },
    { 
        url: 'https://katworld.net/', 
        name: 'katworld',
        type: 'redirect',
        fetchUrl: 'https://katworld.net/?type=KatmovieHD'
    }
];

async function scrapeLinks() {
    const results = {};
    
    for (const site of SITES_TO_SCRAPE) {
        try {
            console.log(`Fetching data for ${site.url}...`);
            
            if (site.type === 'redirect') {
                // redirect wali sites (jaise katworld) me bas fetch karke final url dekhna hota hai
                const response = await fetch(site.fetchUrl);
                let finalUrl = response.url;
                if (finalUrl !== site.fetchUrl) {
                    results[site.url.replace(/\/$/, '')] = finalUrl.replace(/\/$/, '');
                    console.log(`✅ Found dynamic link for ${site.url}: ${finalUrl}`);
                } else {
                    console.log(`⚠️ No dynamic link found on ${site.url}`);
                }
            } 
            else {
                // html wali sites jahan page me link chhipa hota hai
                const response = await fetch(site.url);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                
                const html = await response.text();
                const $ = cheerio.load(html);
                let dynamicLink = null;
                
                $('a').each((i, element) => {
                    let href = $(element).attr('href');
                    if (href && href.startsWith('http') && !href.includes(site.name + '.insure')) {
                        dynamicLink = href;
                        return false; 
                    }
                });
                
                if (dynamicLink) {
                    results[site.url.replace(/\/$/, '')] = dynamicLink.replace(/\/$/, '');
                    console.log(`✅ Found dynamic link for ${site.url}: ${dynamicLink}`);
                } else {
                    console.log(`⚠️ No dynamic link found on ${site.url}`);
                }
            }
        } catch (error) {
            console.error(`❌ Error scraping ${site.url}:`, error.message);
        }
    }
    
    // Save mapping to file
    fs.writeFileSync('dynamic-links.json', JSON.stringify(results, null, 2));
    console.log('\ndynamic-links.json updated successfully!');
}

scrapeLinks();
