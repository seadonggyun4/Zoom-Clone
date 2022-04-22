const backSocket = io() // io(): 자동적으로 프론트엔드와 백엔드를 연결해 주는 socket.io 내장 함수

// ============================== [ 연결된 장치중 카메라 장비만 추출 ] ==============================
const camerasSelect = document.querySelector('#cameras')

async function getCameras(){
    try{
        const devices = await navigator.mediaDevices.enumerateDevices(); // 컴퓨터에 연결된 장치들을 받아온다.
        const cameras = devices.filter(device => device.kind === "videoinput")// 컴퓨터에 연결된 카메라 장치들을 받아온다.
        
        const currentCamera =  myStream.getVideoTracks()[0]// 현재 연결된 비디오 장치들중 1번째 값을 넣는다.

        cameras.forEach(camera => {
            const option = document.createElement('option')
            option.value = camera.deviceId // option의 key값으로 deviceID를 넣는다.
            option.innerText = camera.label // option의 text에 디바이스 이름을 넣는다.

            if(currentCamera.label === camera.label){ //현재 연결된 가장 최상단의 장비와, camera 기기의 이름이 같으면 option태그를 선택됨으로 바꾼다.
                option.selected = true
            }

            camerasSelect.appendChild(option)// 각 camaera기기의 id 값을 camerasSelect 태그에 넣는다.
        })
    }
    catch (error){
        console.log(error)
    }
}


// ============================== [ 카메라 장비만 변경 함수 ] ==============================
async function handleCameraChange(){
    await getMedia(camerasSelect.value) // camerasSelect의 각 기기 ID 값이 매개변수로 들어간다.
    if(myPeerConnection){
        const videoTrack = myStream.getVideoTracks()[0]// getmedia 함수실행후 최신의 값으로 초기화된 videoTrack의 값을 받는다.
        // sender -> peer로 보내진 media stream track을 컨트롤 할 수 있게 한다.
        // 나에게 연결된 장치중 video만 받아온다.
        const videoSender = myPeerConnection
        .getSenders()
        .find((sender) => sender.track.kind === "video");
        
        videoSender.replaceTrack(videoTrack)// video인 stream track데이터를 새로 선택한 비디오로 바꾼다.
    }
}


camerasSelect.addEventListener('input', handleCameraChange)






// ============================== [ 비디오 데이터 화면에 송출 ] ==============================

const myFace = document.querySelector('#myFace')

let myStream


async function getMedia(deviceId){
    const initialConstrains = { // 카메라 선택을 안했을때
        audio: true,
        video: { facingMode: "user" }// 셀프카메라 촬영모드 선택
    }

    const cameraConstraints = { // 카메라 선택을 했을때
        audio: true, 
        video: {deviceId: { exact: deviceId }} //deviceId값의 ID값인 카메라 선택
    }

    
    
    try{
        // navigator -> 브라우저 정보 객체
        // navigator.mediaDevices.getUserMedia() -> 카메라와 마이크를 포함하는 MediaStream 객체를 얻어올 수 있다
        myStream = await navigator.mediaDevices.getUserMedia(
            deviceId?  cameraConstraints : initialConstrains
        )
        myFace.srcObject = myStream // 비디오 태그의 srcObject 속성에 mediaStream 객체를 넣는다.

        if(!deviceId){//deviceId가 없을때 한번만 실행 
            await getCameras()// 카메라 목록 가져오기
        }
    }
    catch (error){
        console.log(error)
    }
}

// getMedia()

// ============================== [ Mute, Camera 버튼 제어 ] ==============================

const muteBtn = document.querySelector('#mute')
const cameraBtn = document.querySelector('#camera')

let muted = false
let cameraOff = false


// [ 소리 제어하기 ]
function handleMuteClick(){
    // myStream.getAudioTracks()의 enabled의 값을 cick이벤트로 제어한다.
    myStream
    .getAudioTracks()
    .forEach((track) => (track.enabled = !track.enabled));

    if(!muted){// 음소거가 아닐때
        muteBtn.innerText = 'Unmute'
        muted = true
    } else {
        muteBtn.innerText = 'Mute'
        muted = false
    }
}

// [ 카메라 제어하기 ]
function handleCameraClick(){
    myStream
    .getVideoTracks()
    .forEach((track) => (track.enabled = !track.enabled))

    if(cameraOff){//카메라가 꺼져있을때
        cameraBtn.innerText = "Trun Camera Off"
        cameraOff = false
    } else {
        cameraBtn.innerText = "Trun Camera On"
        cameraOff = true
    }
}

muteBtn.addEventListener('click', handleMuteClick)
cameraBtn.addEventListener('click', handleCameraClick)


// ============================== [ room 과 mediadivece의 전체 태그 제어 ] ==============================

const welcome = document.querySelector('#welcome')
const call = document.querySelector('#call')
const welcomeForm = welcome.querySelector('form')

let roomName

call.hidden = true



// [ 미디어 디바이스 재생 함수 ]
async function initCall(){
    welcome.hidden = true
    call.hidden = false
    await getMedia() // 미디어 디바이스 실행함수
    makeConnection()// webRTC연결 실행함수
}

// [ 방 이름 저장후 입장 함수 ]
async function handleWelcomeSubmit(event){
    event.preventDefault()
    const input = welcomeForm.querySelector('input')
    await initCall()
    backSocket.emit('join_room', input.value)// 방이름과, 미디어 디바이스 제어함수를 백엔드로 보낸다.
    roomName = input.value
    input.value = ""
}

welcomeForm.addEventListener('submit', handleWelcomeSubmit)



// ================================= [ Socket.io 시그널링 채널을 통한 연결  제어 ] =================================
// [ Socket.io Code ]

/// === 주체자가  offer을 생성한뒤 서버(시그널링 채널)를 통해 백단에 넘긴다.
backSocket.on('welcom', async () => {
    const offer = await myPeerConnection.createOffer() // 주체자가 offer을 생성한다. => offer은 다른 peer와 연결할수 있는 초대장과 마찬가지
    myPeerConnection.setLocalDescription(offer)// setLocalDescription(offer)로 Local 환경에서 연결구성 (합의과정을 제안할때)
    backSocket.emit('offer', offer, roomName)// offer을 전달하기 위해 offer,roomName을 백엔드로 넘긴다.
    console.log('Somebody Joined !! 😁')
})

// === 주체자가 넘긴 offer을 접속자가 서버(시그널링 채널)을 통해 받아온다.
backSocket.on('offer', async (offer) => {
    myPeerConnection.setRemoteDescription(offer)// 받아온 offer를 Description한다. => offer을 합의과정을 받을때
    const answer = await myPeerConnection.createAnswer()// 접속자peer가 대답을 만든다. => offer에 대한 대답?
    myPeerConnection.setLocalDescription(answer)// 주체자 peer에게 setLocalDescription(answer) 대답을 보낸다.(합의과정을 제안할때)

    backSocket.emit('answer', answer, roomName)
})

// === 접속자가 넘긴 answer을 서버(시그널링 채널)을 통해 주체자가 받아온다.
backSocket.on('answer', answer => {
    myPeerConnection.setRemoteDescription(answer)// 접속자가 넘긴 answer을 setRemoteDescription(answer)로 받는다.
})

// === 상대 peer들로 부터 받은 ice를 자기자신에게 추가한다.
backSocket.on('ice', ice => {
    myPeerConnection.addIceCandidate(ice) // 받아온 ice를 추가 
    console.log('Recived ice candidate! 🥶')
})




// ================================= [ webRTC 연결을  제어: ICE Candidate ] =================================
let myPeerConnection
const my = document.querySelector('#myStream')

// [ RTC Code ]
function makeConnection(){
    myPeerConnection = new RTCPeerConnection()// RTC통신 시작 -> p2p 연결의 각 p가 만들어진다.
    // icecandidate 이벤트 시작 =>  시그널링 채널을 통한 합의과정의 이루어진후 P2P 연결을 위해 실행되는 이벤트!!!
    myPeerConnection.addEventListener('icecandidate', handleIce)
    // addstream 이벤트 시작 => icecandidate 교환까지 끝나면 연결된 peer의 stream 값을 받아 화면에 표현하기 위함
    myPeerConnection.addEventListener('addstream', handleAddStream)

    myStream.getTracks().forEach( track => myPeerConnection.addTrack(track, myStream)) // 영상데이터, 음성데이터를 myPeerConnection에 넣는다.
}


// [ ice,roomName을 back 서버로 보낸다. ]
function handleIce(data){
    // 생성된 icecandidate는, 시그널링 채널을 통해 연결된 다른 Peer들에게 전달되어야 한다. => 연결을 위함
    backSocket.emit('ice', data.candidate, roomName)
    console.log('Send ice candidate! 🥶')
}


// [연결된 peer로 부터 stream값을 받아 화면에 표현]
function handleAddStream(data){
    // const peerFace = document.querySelector('#peerFace')
    // peerFace.srcObject = data.stream

    const peerFace = document.createElement('video')
    peerFace.setAttribute('autoplay', true)
    peerFace.setAttribute('playsinline',true)
    my.appendChild(peerFace)
    peerFace.srcObject = data.stream
    
}