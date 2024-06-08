const fs = require("fs");
const path = require('path');
//const fetch = require('node-fetch');

const data = {
    players: []
};


// const fetchedData = fetch("https://api.afl.com.au/cfs/afl/playerStats/match/CD_M20240141101", {
//     headers: {
//         "accept": "*/*",
//         "accept-language": "en-GB,en-US;q=0.9,en;q=0.8",
//         "if-none-match": "W/\"685a1fb4b92c4c28556fdfcc9602260d\"",
//         "priority": "u=1, i",
//         "sec-ch-ua": "\"Google Chrome\";v=\"125\", \"Chromium\";v=\"125\", \"Not.A/Brand\";v=\"24\"",
//         "sec-ch-ua-mobile": "?0",
//         "sec-ch-ua-platform": "\"macOS\"",
//         "sec-fetch-dest": "empty",
//         "sec-fetch-mode": "cors",
//         "sec-fetch-site": "same-site",
//         "x-media-mis-token": "74c3f88528c0ba1dd5d3f157392dcb92",
//         "Referer": "https://www.afl.com.au/",
//     },
//     body: null,
//     method: "GET"
// }).then(data => data.text())
//     .then(data => {
//         var player = {
//             number: 0,
//             name: 0,
//             goals: 0,
//             behinds: 0,
//             kicks: 0,
//             handballs: 0,
//             marks: 0,
//             tackles: 0,
//             hitouts: 0,
//             tog: 0,
//             fantasy: 0,
//             fantasyAvg: 0,
//             team: 0,
//             teamName: 0,
//             url: 0,
//             teamScore: 0,
//             teamScoreTotal: 0,
//             time: 0,
//             sub: 0,
//             breakeven: 0,
//             price: 0,
//             position: 0,
//             benched: 0,
//             injured: 0,
//             freesfor: 0,
//             freesagainst: 0,
//             round: 0,
//             date: 0,
//             trimmedLink: 0,
//         }


//         const jData = JSON.parse(data);
//         let firstName = jData.homeTeamPlayerStats[0].player.player.player.playerName.givenName;
//         let lastName = jData.homeTeamPlayerStats[0].player.player.player.playerName.surname;
//         player.name = firstName.charAt(0) + "." + lastName;
//         player.number = jData.homeTeamPlayerStats[0].player.player.player.playerJumperNumber;


//         player.goals = jData.homeTeamPlayerStats[0].playerStats.stats.goals;
//         player.behinds = jData.homeTeamPlayerStats[0].playerStats.stats.behinds;
//         player.kicks = jData.homeTeamPlayerStats[0].playerStats.stats.kicks;
//         player.handballs = jData.homeTeamPlayerStats[0].playerStats.stats.handballs;
//         player.marks = jData.homeTeamPlayerStats[0].playerStats.stats.marks;
//         player.tackles = jData.homeTeamPlayerStats[0].playerStats.stats.tackles;
//         player.hitouts = jData.homeTeamPlayerStats[0].playerStats.stats.hitouts;
//         player.tog = jData.homeTeamPlayerStats[0].playerStats.timeOnGroundPercentage;
//         player.fantasy = jData.homeTeamPlayerStats[0].playerStats.stats.dreamTeamPoints;
//         // player.fantasyAvg = jData.homeTeamPlayerStats[0].playerStats.stats.dreamTeamAverage;
//         player.team = 0;
//         player.teamName = jData.homeTeamPlayerStats[0].teamId;
//         player.url = jData.homeTeamPlayerStats[0].player.photoURL;
//         // player.teamScore = jData.homeTeamPlayerStats[0].teamScore;
//         // player.teamScoreTotal = jData.homeTeamPlayerStats[0].teamScoreTotal;
//         // player.time = jData.homeTeamPlayerStats[0].timeOnGround;
//         // player.sub = jData.homeTeamPlayerStats[0].substitute;
//         // player.breakeven = jData.homeTeamPlayerStats[0].breakeven;
//         // player.price = jData.homeTeamPlayerStats[0].price;
//         // player.position = jData.homeTeamPlayerStats[0].position;
//         // player.benched = jData.homeTeamPlayerStats[0].benched;
//         // player.injured = jData.homeTeamPlayerStats[0].injured;
//         player.freesfor = jData.homeTeamPlayerStats[0].playerStats.stats.freesFor;
//         player.freesagainst = jData.homeTeamPlayerStats[0].playerStats.stats.freesAgainst;
//         // player.round = jData.homeTeamPlayerStats[0].round;
//         // player.date = jData.homeTeamPlayerStats[0].date;
//         // player.trimmedLink = jData.homeTeamPlayerStats[0].trimmedLink;







//         console.log(player);


//         fs.promises.writeFile('fetchedStats.json', data);

//     })
//     .catch(error => {
//         console.error(error);
//     });


const supercoachScores = fetch("https://supercoach.heraldsun.com.au/2024/api/afl/classic/v1/players-cf?embed=notes%2Codds%2Cplayer_stats%2Cpositions&round=10&xredir=1", {
    headers: {
        "accept": "application/json, text/plain, */*",
        "sec-ch-ua": "\"Google Chrome\";v=\"125\", \"Chromium\";v=\"125\", \"Not.A/Brand\";v=\"24\"",
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": "\"macOS\"",
        "Referer": "https://supercoach.heraldsun.com.au/afl/classic/team/field",
    },
    body: null,
    method: "GET"
}).then(data => data.text())
    .then(data => {
        let jData = JSON.parse(data);
        let result = jData.map(player => ({
            playerName: player.first_name.charAt(0) + '.' + player.last_name,
            livepts: player.player_stats[0].livepts,
            supercoachPrice: player.player_stats[0].price,
        }));
        // return result;
        fs.promises.writeFile('fetchedStats.json', JSON.stringify(result));
    })
    .catch(error => {
        console.error(error);
    });




    fetch("https://supercoach.heraldsun.com.au/2024/api/afl/classic/v1/userteams/94278/statsPlayers?round=11", {
  "headers": {
    "accept": "application/json",
    "accept-language": "en-GB,en-US;q=0.9,en;q=0.8",
    "authorization": "Bearer 7b991d44a5c09b7f12948123ea198da1896afcca",
    "priority": "u=1, i",
    "sec-ch-ua": "\"Google Chrome\";v=\"125\", \"Chromium\";v=\"125\", \"Not.A/Brand\";v=\"24\"",
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": "\"macOS\"",
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-origin",
    "cookie": "_cb=BBEom9D-gAtdDSxyRx; _v__chartbeat3=CqEhHbpNSRqgDj9U; s_ecid=MCMID%7C50952775251532227403257845436215240118; mdLogger=false; _gcl_au=1.1.861059579.1711003034; FCNEC=%5B%5B%22AKsRol_eMYpKmvg8b8a3rBtG4JgsJ8rlWJKlkpuCaDOp3N1TxGNZOV1uh4LDbsRlveNzCLcNR4T_XZGTy1QtN4pnNoWjwpUbeL4XQ1MpNg_MhOwieuvs4EMWTjuAZrsLemV9-RtYsckgOhC9I3-PN3aNpz46q-jQCQ%3D%3D%22%5D%5D; _ncid=428ac3ecce8c621e64f06d13348e68ee; aam_uuid=50976555106719010063260250359764874412; kndctr_5FE61C8B533204850A490D4D_AdobeOrg_identity=CiY1MDk1Mjc3NTI1MTUzMjIyNzQwMzI1Nzg0NTQzNjIxNTI0MDExOFIPCNSO28z3MBgBKgRBVVMz8AGU2ODB8jE=; _scid=633746d7-5757-4b5d-b724-0ae1e362a0ef; DM_SitId1557=1; DM_SitId1557SecId13522=1; metrics_pcsid=63798800; _ce.irv=returning; cebs=1; _gid=GA1.3.330216156.1716630655; _ce.clock_event=1; AMCVS_5FE61C8B533204850A490D4D%40AdobeOrg=1; c_m=www.google.comNatural%20Search; s_cc=true; _lr_geo_location_state=NSW; _lr_geo_location=AU; _clck=1s3qgpm%7C2%7Cfm2%7C0%7C1541; _ce.clock_data=3%2C49.179.117.212%2C1%2C8381c048a9d70230af13a12a76663dc4%2CChrome%2CAU; _sctr=1%7C1716559200000; s_inv=4444; n_regis=123456789; nk=1f8f749841bc80e6df0bac0cb01e8346; nk_ts=1716635137; optimizelyEndUserId=oeu1716635141318r0.8587910627567483; _ncg_sp_ses.ff50=*; nc_aam_segs=asgmnt%3D16675898; aam_uuid=50976555106719010063260250359764874412; s_exstk=%5B%5B%27InternalDisplay%257B%257B%257B%27%2C%271716635149955%27%5D%5D; s_cobstk=%5B%5B%27%257Bplatform%257B2020_supercoach_plus%257Binternaldisplay%27%2C%271716635149955%27%5D%5D; s_sq=%5B%5BB%5D%5D; subscriber_token={%22entitlements%22:true}; nk_debug=nk_set; s_ips=862; _ncg_id_=18faf6dee30-7391982b-52dc-45f1-a146-9ffac88dafdb; rampart_token=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ik1UVkdNRGxETUVaRk1qWkdOVU0yT0RnNFF6VTROalZCTlRsR1FrUTRSamM1TVROQ09UWTJOZyJ9.eyJodHRwOi8vbG9naW4ubmV3c2NvcnBhdXN0cmFsaWEuY29tLmF1L3Byb2ZpbGUiOnsicmF0IjoxNjc4MjM1MTI2LCJ0aGlua19pZCI6IjYzNzk4ODAwIiwiY3VzdG9tZXJfcHJvZHVjdF9ob2xkaW5nIjpbIlpaX05MX1JFRyIsIlpaX1NDX0FGTFRSSUFMMTUiLCJaWl9TQ19EREZSTk9FTlQiLCJaWl9TQ19OUkxUUklBTDE1IiwiWlpfSFNfREQiXSwic2l0ZSI6InN1cGVyY29hY2giLCJoYXNfY29uc2VudGVkX3RvX3RjIjp0cnVlLCJhdHNfaGFzaCI6IjdmYzBhOWQwNWFiZDYzZjE3ZjM1NjE0YzcyZjJhM2FmZDliYzZkMmQwNTU1NDcxYjk5MjQxM2ZiOWYzNDc5YzIuOGE5NjRhYzNmYmQ4ODJkMzk3NTk3NzMxMDJjYmMzYWVjNzFhNzliNyIsImF1dGhQcm92aWRlciI6ImF1dGgwIn0sIm5pY2tuYW1lIjoiSGFydmFyZCIsIm5hbWUiOiJDaGFybGVzIiwicGljdHVyZSI6Imh0dHBzOi8vcy5ncmF2YXRhci5jb20vYXZhdGFyLzM5NjkwYzAyZjVkNTFhMzk4ZThiYWViZTk1M2U1MGY2P3M9NDgwJnI9cGcmZD1odHRwcyUzQSUyRiUyRmNkbi5hdXRoMC5jb20lMkZhdmF0YXJzJTJGY2gucG5nIiwidXBkYXRlZF9hdCI6IjIwMjQtMDUtMjVUMTE6MDY6NDAuNjY2WiIsImlzcyI6Imh0dHBzOi8vbG9naW4ubmV3c2NvcnBhdXN0cmFsaWEuY29tLyIsImF1ZCI6IlpZQ290bGlocWFHdWFxU3NTdnUwTDJ2eERkUVhDdzE2IiwiaWF0IjoxNzE2NjM1MjIwLCJleHAiOjE3MjM5NzkyMjAsInN1YiI6ImF1dGgwfDY0MDdkNWY2NjA2ZmM0YjZhYTQ5MDJiMyIsImF0X2hhc2giOiJDZ3lONkw0ZDFnUEJUbldyZW1uTnpRIiwic2lkIjoiQVlUbGxrTVo4SXZSQ2pfWlBQNXVEZVJpSmM1ZUUyeEYiLCJub25jZSI6IlhkNn5RMXkyX1JlX0lJM1NyX3NSWTRPUXdLdC05aG9sIn0.yD7XQI0BL4dcNpgtTzyN_vokeGUEIkZPK-GHBr9HQAMx4OlBqfx0rU-QJkRYqM8qAR7YNHsYoU5ttI2W_9ohsVQRl1kf6Za0OSglcwkmnHQMGj8EeBN1jBgiRqwnRgpAEZRWsddtQw5Sq8njJtNt6SGNBsY24BUy_buP793oWEjSNwE5USXUNpt9p4D5F903eJOZIN6JsvmRbNFW8TIv0QCgrDhwR5VTCUi2McrAripoXdhp_nb93bKYuJG8xJfQOnoSGBt10ZqO4zAxB9gb4pXc8AgYzW8CHZZmoYmjiZyWvhkbZ0rljXiNm1--YSpJV5Oc1pPnkw2oZuM101ZGqQ; nearSessionCookie=0.09034658122245576; _cb_svref=https%3A%2F%2Fwww.google.com%2F; _gat_gtag_UA_92560_41=1; s_tp=862; s_ppn=hs%7Csport%7Cindex%7Cafl-supercoach-classic-team; _clsk=u4z766%7C1716635229893%7C6%7C0%7Cu.clarity.ms%2Fcollect; utag_main=v_id:01877996b94b00185dfc9317200305075002406d00ac8$_sn:7$_se:5$_ss:0$_st:1716637036984$ses_id:1716635146806%3Bexp-session$_pn:5%3Bexp-session; _rdt_uuid=1711003033189.e1eb3177-c12c-46c4-b85c-4baf0c435ce3; _ga=GA1.3.1075508034.1681372135; _uetsid=46fa86b01a7c11ef9f3bf1bde74fab41; _uetvid=738e0780e74d11ee909e71b092db6616; _ncg_sp_id.ff50=e0663a3a-a531-49cd-b88a-11d0dc0a5250.1681372134.7.1716635237.1716630681.0570723a-293c-4458-a07e-181c59e3afcc; _chartbeat2=.1681372133998.1716635237238.0000000000000001.voaI0Dzu1FlBDxcf3CsesjNC9KHuU.2; nol_fpid=aut6naunhats1qublgdwnjlrbl3io1711003033|1711003033557|1716635237268|1716635237382; kampyleUserSession=1716635237461; kampyleUserSessionsCount=7; kampyleSessionPageCounter=1; kampyleUserPercentile=27.63686678609496; _scid_r=633746d7-5757-4b5d-b724-0ae1e362a0ef; cebsp_=8; s_nr30=1716635238185-Repeat; s_tslv=1716635238185; s_ppv=hs%257Csport%257Cindex%257Cafl-supercoach-classic-team%2C100%2C100%2C862%2C1%2C1; AMCV_5FE61C8B533204850A490D4D%40AdobeOrg=-637568504%7CMCIDTS%7C19869%7CMCMID%7C50952775251532227403257845436215240118%7CMCAAMLH-1717240038%7C8%7CMCAAMB-1717240038%7CRKhpRz8krg2tLO6pguXWp5olkAcUniQYPHaMWWgdJ3xzPWQmdj0y%7CMCOPTOUT-1716642438s%7CNONE%7CMCAID%7CNONE%7CvVersion%7C5.1.1%7CMCCIDH%7C8717756; nc_aam_segs=asgmnt%3D16675898%2C18585410%2C19451952%2C19452046; _ga_TG4PPMS35Z=GS1.1.1716635137.7.1.1716635244.0.0.0; _chartbeat4=t=C1FGw5CQ8xZ8osRHVLqCCyC_HOXN&E=3&x=0&c=0.13&y=862&w=862; _ce.s=v~8f0db09cf760a6599ba7156f75a8654a5ea0715c~lcw~1716635244724~lva~1716630654635~vpv~1~v11.cs~93908~v11.s~47ba18e0-1a7c-11ef-af25-6f75f2fc2a4c~v11.sla~1716635244849~v11.send~1716635244723~lcw~1716635244849",
    "Referer": "https://supercoach.heraldsun.com.au/afl/classic/team/field",
    "Referrer-Policy": "strict-origin-when-cross-origin"
  },
  "body": null,
  "method": "GET"
});
    

fetch("https://supercoach.heraldsun.com.au/2024/api/afl/classic/v1/players-cf?embed=notes%2Codds%2Cplayer_stats%2Cpositions&round=10&xredir=1&subid=9&subkey=b94ea1757f5940d35e41ff7b58bb9246", {
  "headers": {
    "accept": "application/json, text/plain, */*",
    "accept-language": "en-GB,en-US;q=0.9,en;q=0.8",
    "priority": "u=1, i",
    "sec-ch-ua": "\"Google Chrome\";v=\"125\", \"Chromium\";v=\"125\", \"Not.A/Brand\";v=\"24\"",
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": "\"macOS\"",
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-origin",
    "cookie": "_cb=BBEom9D-gAtdDSxyRx; _v__chartbeat3=CqEhHbpNSRqgDj9U; s_ecid=MCMID%7C50952775251532227403257845436215240118; mdLogger=false; _gcl_au=1.1.861059579.1711003034; FCNEC=%5B%5B%22AKsRol_eMYpKmvg8b8a3rBtG4JgsJ8rlWJKlkpuCaDOp3N1TxGNZOV1uh4LDbsRlveNzCLcNR4T_XZGTy1QtN4pnNoWjwpUbeL4XQ1MpNg_MhOwieuvs4EMWTjuAZrsLemV9-RtYsckgOhC9I3-PN3aNpz46q-jQCQ%3D%3D%22%5D%5D; _ncid=428ac3ecce8c621e64f06d13348e68ee; aam_uuid=50976555106719010063260250359764874412; kndctr_5FE61C8B533204850A490D4D_AdobeOrg_identity=CiY1MDk1Mjc3NTI1MTUzMjIyNzQwMzI1Nzg0NTQzNjIxNTI0MDExOFIPCNSO28z3MBgBKgRBVVMz8AGU2ODB8jE=; _scid=633746d7-5757-4b5d-b724-0ae1e362a0ef; DM_SitId1557=1; DM_SitId1557SecId13522=1; metrics_pcsid=63798800; _ce.irv=returning; cebs=1; _gid=GA1.3.330216156.1716630655; _ce.clock_event=1; AMCVS_5FE61C8B533204850A490D4D%40AdobeOrg=1; c_m=www.google.comNatural%20Search; s_cc=true; _lr_geo_location_state=NSW; _lr_geo_location=AU; _clck=1s3qgpm%7C2%7Cfm2%7C0%7C1541; _ce.clock_data=3%2C49.179.117.212%2C1%2C8381c048a9d70230af13a12a76663dc4%2CChrome%2CAU; _sctr=1%7C1716559200000; s_inv=4444; n_regis=123456789; nk=1f8f749841bc80e6df0bac0cb01e8346; nk_ts=1716635137; optimizelyEndUserId=oeu1716635141318r0.8587910627567483; _ncg_sp_ses.ff50=*; nc_aam_segs=asgmnt%3D16675898; aam_uuid=50976555106719010063260250359764874412; s_exstk=%5B%5B%27InternalDisplay%257B%257B%257B%27%2C%271716635149955%27%5D%5D; s_cobstk=%5B%5B%27%257Bplatform%257B2020_supercoach_plus%257Binternaldisplay%27%2C%271716635149955%27%5D%5D; s_sq=%5B%5BB%5D%5D; subscriber_token={%22entitlements%22:true}; nk_debug=nk_set; s_ips=862; _ncg_id_=18faf6dee30-7391982b-52dc-45f1-a146-9ffac88dafdb; rampart_token=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ik1UVkdNRGxETUVaRk1qWkdOVU0yT0RnNFF6VTROalZCTlRsR1FrUTRSamM1TVROQ09UWTJOZyJ9.eyJodHRwOi8vbG9naW4ubmV3c2NvcnBhdXN0cmFsaWEuY29tLmF1L3Byb2ZpbGUiOnsicmF0IjoxNjc4MjM1MTI2LCJ0aGlua19pZCI6IjYzNzk4ODAwIiwiY3VzdG9tZXJfcHJvZHVjdF9ob2xkaW5nIjpbIlpaX05MX1JFRyIsIlpaX1NDX0FGTFRSSUFMMTUiLCJaWl9TQ19EREZSTk9FTlQiLCJaWl9TQ19OUkxUUklBTDE1IiwiWlpfSFNfREQiXSwic2l0ZSI6InN1cGVyY29hY2giLCJoYXNfY29uc2VudGVkX3RvX3RjIjp0cnVlLCJhdHNfaGFzaCI6IjdmYzBhOWQwNWFiZDYzZjE3ZjM1NjE0YzcyZjJhM2FmZDliYzZkMmQwNTU1NDcxYjk5MjQxM2ZiOWYzNDc5YzIuOGE5NjRhYzNmYmQ4ODJkMzk3NTk3NzMxMDJjYmMzYWVjNzFhNzliNyIsImF1dGhQcm92aWRlciI6ImF1dGgwIn0sIm5pY2tuYW1lIjoiSGFydmFyZCIsIm5hbWUiOiJDaGFybGVzIiwicGljdHVyZSI6Imh0dHBzOi8vcy5ncmF2YXRhci5jb20vYXZhdGFyLzM5NjkwYzAyZjVkNTFhMzk4ZThiYWViZTk1M2U1MGY2P3M9NDgwJnI9cGcmZD1odHRwcyUzQSUyRiUyRmNkbi5hdXRoMC5jb20lMkZhdmF0YXJzJTJGY2gucG5nIiwidXBkYXRlZF9hdCI6IjIwMjQtMDUtMjVUMTE6MDY6NDAuNjY2WiIsImlzcyI6Imh0dHBzOi8vbG9naW4ubmV3c2NvcnBhdXN0cmFsaWEuY29tLyIsImF1ZCI6IlpZQ290bGlocWFHdWFxU3NTdnUwTDJ2eERkUVhDdzE2IiwiaWF0IjoxNzE2NjM1MjIwLCJleHAiOjE3MjM5NzkyMjAsInN1YiI6ImF1dGgwfDY0MDdkNWY2NjA2ZmM0YjZhYTQ5MDJiMyIsImF0X2hhc2giOiJDZ3lONkw0ZDFnUEJUbldyZW1uTnpRIiwic2lkIjoiQVlUbGxrTVo4SXZSQ2pfWlBQNXVEZVJpSmM1ZUUyeEYiLCJub25jZSI6IlhkNn5RMXkyX1JlX0lJM1NyX3NSWTRPUXdLdC05aG9sIn0.yD7XQI0BL4dcNpgtTzyN_vokeGUEIkZPK-GHBr9HQAMx4OlBqfx0rU-QJkRYqM8qAR7YNHsYoU5ttI2W_9ohsVQRl1kf6Za0OSglcwkmnHQMGj8EeBN1jBgiRqwnRgpAEZRWsddtQw5Sq8njJtNt6SGNBsY24BUy_buP793oWEjSNwE5USXUNpt9p4D5F903eJOZIN6JsvmRbNFW8TIv0QCgrDhwR5VTCUi2McrAripoXdhp_nb93bKYuJG8xJfQOnoSGBt10ZqO4zAxB9gb4pXc8AgYzW8CHZZmoYmjiZyWvhkbZ0rljXiNm1--YSpJV5Oc1pPnkw2oZuM101ZGqQ; nearSessionCookie=0.09034658122245576; _cb_svref=https%3A%2F%2Fwww.google.com%2F; s_tp=862; s_ppn=hs%7Csport%7Cindex%7Cafl-supercoach-classic-team; AMCV_5FE61C8B533204850A490D4D%40AdobeOrg=-637568504%7CMCIDTS%7C19869%7CMCMID%7C50952775251532227403257845436215240118%7CMCAAMLH-1717240038%7C8%7CMCAAMB-1717240038%7CRKhpRz8krg2tLO6pguXWp5olkAcUniQYPHaMWWgdJ3xzPWQmdj0y%7CMCOPTOUT-1716642438s%7CNONE%7CMCAID%7CNONE%7CvVersion%7C5.1.1%7CMCCIDH%7C8717756; nc_aam_segs=asgmnt%3D16675898%2C18585410%2C19451952%2C19452046; utag_main=v_id:01877996b94b00185dfc9317200305075002406d00ac8$_sn:7$_se:6$_ss:0$_st:1716637048584$ses_id:1716635146806%3Bexp-session$_pn:6%3Bexp-session; _uetsid=46fa86b01a7c11ef9f3bf1bde74fab41; _uetvid=738e0780e74d11ee909e71b092db6616; _chartbeat2=.1681372133998.1716635248743.0000000000000001.voaI0Dzu1FlBDxcf3CsesjNC9KHuU.3; _ncg_sp_id.ff50=e0663a3a-a531-49cd-b88a-11d0dc0a5250.1681372134.7.1716635249.1716630681.0570723a-293c-4458-a07e-181c59e3afcc; _rdt_uuid=1711003033189.e1eb3177-c12c-46c4-b85c-4baf0c435ce3; _scid_r=633746d7-5757-4b5d-b724-0ae1e362a0ef; kampyleUserSession=1716635249017; kampyleUserSessionsCount=8; kampyleSessionPageCounter=1; kampyleUserPercentile=82.618401848397; nol_fpid=aut6naunhats1qublgdwnjlrbl3io1711003033|1711003033557|1716635248813|1716635249061; _ga_TG4PPMS35Z=GS1.1.1716635137.7.1.1716635249.0.0.0; _ga=GA1.1.1075508034.1681372135; cebsp_=9; s_nr30=1716635249447-Repeat; s_tslv=1716635249447; s_ppv=hs%257Csport%257Cindex%257Cafl-supercoach-classic-team%2C100%2C100%2C862%2C1%2C1; _clsk=u4z766%7C1716635250084%7C7%7C0%7Cu.clarity.ms%2Fcollect; _ce.s=v~8f0db09cf760a6599ba7156f75a8654a5ea0715c~lcw~1716635263062~lva~1716630654635~vpv~1~v11.cs~93908~v11.s~47ba18e0-1a7c-11ef-af25-6f75f2fc2a4c~v11.sla~1716635263455~lcw~1716635263455",
    "Referer": "https://supercoach.heraldsun.com.au/afl/classic/team/field",
    "Referrer-Policy": "strict-origin-when-cross-origin"
  },
  "body": null,
  "method": "GET"
});