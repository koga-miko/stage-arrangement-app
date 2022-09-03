import piano_image from "./images/piano.png"

export const canvasInfo = {
    w: 1800,
    h: 900,
}

export const seatsArrangerInfo = {
    distToStand: 40,
    tactWH: {
        w: 100,
        h: 65   ,
    },
}

export const seatsInfo = {
    seatRadius: 33,
    distCenterLR: 75,
    distSideLR: 75,
    ellipticity: 0.9,
    seatsCircles: [
        {
            distCF: 100,
            num: 8,
        },
        {
            distCF: 200,
            num: 12,
        },
        {
            distCF: 300,
            num: 16,
        },
        {
            distCF: 400,
            num: 20,
        },
        {
            distCF: 500,
            num: 24,
        },
        {
            distCF: 600,
            num: 28,
        },
        {
            distCF: 700,
            num: 32,
        },
    ],
}

export const cbLayerInfo = {
    rect: {
        x: 1270,
        y: 70,
        w: 500,
        h: 140,
    },
    seatWH: {
        w: 58,
        h: 58,
    },
    distToStand: 55,
    seatsInfs: [
        {
            x:0,
            y:0,
        },
        {
            x:80,
            y:0,
        },
        {
            x:160,
            y:0,
        },
        {
            x:240,
            y:0,
        },
        {
            x:320,
            y:0,
        },
        {
            x:400,
            y:0,
        },
    ]
}

export const SimplePartsInfo = {
    common: {
        w: 120,
        h: 60,
    },
    parts: [
        {
            name:"Vn1-label",
            text:"Vn1",
            imgsrc:null,
            x:15,
            y:70,
        },
        {
            name:"Vn2-label",
            text:"Vn2",
            imgsrc:null,
            x:15,
            y:140,
        },
        {
            name:"Vn3-label",
            text:"Vn3",
            imgsrc:null,
            x:15,
            y:210,
        },
        {
            name:"Va-label",
            text:"Va",
            imgsrc:null,
            x:15,
            y:280,
        },
        {
            name:"Vc-label",
            text:"Vc",
            imgsrc:null,
            x:15,
            y:350,
        },
        {
            name:"Cb-label",
            text:"Cb",
            imgsrc:null,
            x:15,
            y:420,
        },
        {
            name:"Pf-image",
            text:"",
            imgsrc: piano_image,
            x:15,
            y:490,
        },
    ]
}
