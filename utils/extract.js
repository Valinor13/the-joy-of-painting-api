const csv = require('csv-parser');
const fs = require('fs');
require("dotenv").config();
const { Client } = require('pg');

Colors = [];
Subjects = [];
epDates = [];
episodesDatesGuests = [];
Episodes = [];

const client = new Client({
    user: process.env.USER,
    host: process.env.HOST,
    database: process.env.DB,
    password: process.env.PW,
    port: process.env.PORT,
});

async function dataCollect() {
    await client.connect();

    client.query(process.env.CREATETABLE);

    await fs.createReadStream('../raw/Colors_Used')
        .pipe(csv({ separator: ',' }))
        .on('data', (dataRow) => {
            delete dataRow[''];
            dataRow.colors = dataRow.colors.slice(2, dataRow.colors.length - 2);
            dataRow.colors = dataRow.colors.split(', ');
            for (let i = 0; i < dataRow.colors.length; i++) {
                dataRow.colors[i] = dataRow.colors[i].replace(/'/gi, '');
                dataRow.colors[i] = dataRow.colors[i].replace(/\\r/gi, '');
                dataRow.colors[i] = dataRow.colors[i].replace(/\\n/gi, '');
            }
            dataRow['color_hex'] = dataRow['color_hex'].slice(2, dataRow['color_hex'].length - 2);
            dataRow['color_hex'] = dataRow['color_hex'].split(', ');
            for (let i = 0; i < dataRow['color_hex'].length; i++) {
                dataRow['color_hex'][i] = dataRow['color_hex'][i].replace(/'/gi, '');
            }
            Colors.push(dataRow);
        });

    await fs.createReadStream('../raw/Subject_Matter')
        .pipe(csv({ separator: ',' }))
        .on('data', (dataRow) => {
            const subList = [];
            dataRow.TITLE = dataRow.TITLE.slice(1, dataRow.TITLE.length - 1);
            Object.keys(dataRow).forEach((key) => {
                if (dataRow[key] === '1') {
                    subList.push(key.toLowerCase());
                }
            });
            dataRow.SUBJECTS = subList;
            Subjects.push(dataRow);
        });

    await fs.createReadStream('../raw/Episode_Dates')
        .pipe(csv())
        .on('data', (dataRow) => {
            epDates.push(Object.values(dataRow)[0]);
        });

    setTimeout(() => {
        epDates.forEach((ep) => {
            const [title, other] = ep.split('(');
            const [date, guest] = other.split(')');
            let tmpArry = [title.slice(1, title.length - 2), date.slice(0, date.length)];
            if (guest && guest !== ' ') {
                tmpArry.push(guest.slice(1, guest.length));
            }
            episodesDatesGuests.push(tmpArry);
        });
        for (let i = 0; i < Colors.length; i++) {
            let episode = {};
            episode.paintingIdx = Colors[i]['painting_index'];
            episode.title = Colors[i].painting_title;
            episode.src = Colors[i]['img_src'];
            episode.season = Colors[i].season;
            episode.episodeNum = Colors[i].episode;
            episode.youtubeSrc = Colors[i]['youtube_src'];
            episode.colors = Colors[i].colors;
            episode.colorHex = Colors[i]['color_hex'];
            episode.subjects = Subjects[i].SUBJECTS;
            episode.date = episodesDatesGuests[i][1];
            if (episodesDatesGuests[i][2]) {
                episode.guest = episodesDatesGuests[i][2];
            }
            let values = [`${episode.paintingIdx}`, `${episode.title}`, `${episode.season}`, `${episode.episodeNum}`, `${episode.date}`, `${episode.src}`, `${episode.youtubeSrc}`, `${episode.guest}`, `${episode.colors}`, `${episode.colorHex}`, `${episode.subjects}`];
            client.query(process.env.TEXT, values);
            Episodes.push(episode);
        }
        console.log(Episodes[0]);
    }, 100)
};

dataCollect();
