const backSocket = io() // io(): 자동적으로 프론트엔드와 백엔드를 연결해 주는 socket.io 내장 함수


const welcome = document.querySelector('#welcome')
const form = welcome.querySelector('form')
const room = document.querySelector('#room')

room.hidden = true


let roomName

function addMessage(msg){
    const ul = room.querySelector('ul')
    const li = document.createElement('li')
    li.innerHTML = msg
    ul.appendChild(li)
}

function handleMessageSubmit(event){
    event.preventDefault()
    const input = room.querySelector('#msg input')
    const value = input.value
    backSocket.emit('new_message', input.value, roomName, () => {
        addMessage(`You: ${value}`)
    })
    input.value= ""
}

function handleNicknameSubmit(event){
    event.preventDefault()
    const input = room.querySelector('#name input')
    backSocket.emit('nickname', input.value)
}


function showRoom(){
    const h3 = room.querySelector('h3')

    welcome.hidden = true
    room.hidden= false

    h3.innerText = `Room: ${roomName}`

    const msgForm = room.querySelector('#msg')
    const nameForm = room.querySelector('#name')
    msgForm.addEventListener('submit', handleMessageSubmit)
    nameForm.addEventListener('submit', handleNicknameSubmit)

}


function handleRoomSubmit(event){
    event.preventDefault()
    const input = form.querySelector('input')
    // emit은 socket.io로 연결된 다른측에 데이터를 보내는방법이다. => websocket의 send와 마찬가지
    // 다른점은 emit은 매개변수로 message만 들어가는것이 아니라 이벤트 명을 직접 정할 수 있다
    // 이벤트와 함께 넘어가는 값 또한 sting 타입 뿐만 아니라 객체,JSON등 다양하게 전송할 수 있다.
    // 또 emit은 매개변수로 콜백함수를 넣을수 있다. => 이는 서버에 인자로 넘어갔다가 서버에서 실행하면 프론트엔드에서 실행된다.(즉 프론트엔드에서 동작할 함수를 백엔드에서 제어가능)
    // emit의 매개변수 양은 정해지지 않았다.
    // 콜백함수는 마지막 매개변수로만 반드시 넣어야 한다.
    backSocket.emit("enter_room", input.value, showRoom)
    roomName = input.value
    input.value = ""
}

form.addEventListener('submit', handleRoomSubmit)


backSocket.on('welcome', (user, newCount) => {
    const h3 = room.querySelector('h3')
    h3.innerText = `Room: ${roomName} (${newCount})`
    addMessage(` ${user} Joined 😁`)
})

backSocket.on('bye', (user, newCount)=>{
    const h3 = room.querySelector('h3')
    h3.innerText = `Room: ${roomName} (${newCount})`
    addMessage(` ${user} Left 🥵`)
})


backSocket.on('new_message', (msg) => {
    addMessage(msg)
})

backSocket.on('room_change', (rooms) => {
    const roomList = welcome.querySelector('ul')
    roomList.innerHTML = ""

    if(rooms.length === 0){
        return
    }

    
    rooms.forEach((room) => {
        const li = document.createElement('li')
        li.innerText =  `방 이름: ${room}`
        roomList.appendChild(li)
    })
})