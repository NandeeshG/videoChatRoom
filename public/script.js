const WIDTH = 720
const HEIGHT = 560
const TIMER_MILLISECONDS = 100
//const SQUARE_SIDE = 25

let videoElem, canvasElem
let intervals = []

const videoGrid = document.getElementById('video-grid')
const socket = io('/')
const peer = new Peer(undefined, {
    host: '/',
    port: '3001',
})

const myVideo = document.createElement('video')
myVideo.muted = true
const peers = {}

async function main() {
    const devicesList = await getAllDevices()
    makeButtonList(devicesList, videoElem, null)
}

socket.on('user-disconnected', (userId) => {
    console.log('user left ', userId)
    if (peers[userId]) peers[userId].close()
})

peer.on('open', (userId) => {
    console.log('joined room with id', ROOM_ID, ' : ', userId)
    socket.emit('join-room', ROOM_ID, userId)
})

function addVideoStream(video, stream) {
    video.srcObject = stream
    video.addEventListener('loadedmetadata', () => {
        video.play()
    })
    videoGrid.append(video)
}

function connectToNewUser(userId, stream) {
    const call = peer.call(userId, stream)
    const video = document.createElement('video')
    call.on('stream', (userVideoStream) => {
        addVideoStream(video, userVideoStream)
    })
    call.on('close', () => {
        video.remove()
    })
    peers[userId] = call
}

//get All Devices
async function getAllDevices() {
    let list = await navigator.mediaDevices.enumerateDevices()
    return list
}

//make button lists
function makeButtonList(devicesList, videoElem, canvasElem) {
    const deviceOptions = document.getElementById('deviceOptions')
    //console.log(devicesList)
    for (let i = 0; i < devicesList.length; ++i) {
        if (devicesList[i].kind === 'videoinput') {
            let btn = document.createElement('button')
            if (devicesList[i].label !== '')
                btn.innerText = devicesList[i].label
            else btn.innerText = 'Camera'
            btn.addEventListener('click', () => {
                intervals.forEach((val) => clearInterval(val))
                setVideoStream(devicesList[i].deviceId, videoElem, canvasElem)
            })
            deviceOptions.append(btn)
        }
    }
}

//define start video stream function
async function setVideoStream(id, videoElem, canvasElem) {
    try {
        navigator.mediaDevices
            .getUserMedia({
                video: {
                    width: WIDTH,
                    height: HEIGHT,
                    deviceId: id,
                },
                audio: false,
            })
            .then((stream) => {
                addVideoStream(myVideo, stream)
                console.log('video started')

                peer.on('call', (call) => {
                    console.log('call received ', call)
                    call.answer(stream)
                    const video = document.createElement('video')
                    call.on('stream', (userVideoStream) => {
                        addVideoStream(video, userVideoStream)
                    })
                })

                socket.on('user-connected', (userId) => {
                    console.log('user connected ', userId)
                    connectToNewUser(userId, stream)
                })
            })

        //videoElem.srcObject = st

        //canvasVideoPlayback(canvasElem, videoElem)
    } catch (err) {
        console.log(err)
    }
}

setVideoStream('', videoElem, null)
//main()
