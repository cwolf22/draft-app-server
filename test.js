const puppeteer = require('puppeteer')

//login:
//get teams html      
sportMapping = {
    baseball: 'sports-baseball',
    football: 'sports-football'
}  
puppeteer.launch({args: ['--no-sandbox', '--disable-setuid-sandbox']}).then(async browser => {
    console.time('go')
    try {
        console.log('launch browser')
        const page = await browser.newPage();
        try {
            console.log('[cbs api] - get login form')
            await page.goto("https://www.cbssports.com/login");
            await page.type('#userid', 'soadsmack178');
            await page.type('#password', 'biggly');
            console.log('[cbs api] - submit form')
            await page.$eval('#login_form', form => form.submit());
            await page.waitForNavigation();
            await page.screenshot({path: 'screenshot.png'});
            console.log('nav')
            await page.goto('https://www.cbssports.com/fantasy/games/my-teams/');
            await page.screenshot({path: 'screenshot2.png'});
            await page.waitForSelector('div.my-teams');
            const nodes = await page.$$('ul.sports-order > li');
            console.log(nodes.length);
            for (let i = 0; i < nodes.length; i++) {
                const prop = await nodes[i].getProperty('id');
                const json = await prop.jsonValue();
                console.log(json)
            }

            
            console.log('done')

        } catch (err) {
            console.log(err)
        }
    } finally {
        console.log('close browser')
        await browser.close();
        console.timeEnd('go');
    }
});