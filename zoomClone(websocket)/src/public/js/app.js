const messageList = document.querySelector('ul')
const nickForm = document.querySelector('#nick')
const messageForm = document.querySelector('#message')

// ================================================================ [ JS객체 -> JSON객체 변환 함수 ] ================================================================
function makeMessage(type, payload){
    const msg = {type, payload} // 매개변수로 받은 type, paylod 객체
    return JSON.stringify(msg) // 객체 -> JSON문자열로 변환하여 반환
}

// ================================================================ [ WS 을 통한 프론트에서 서버로 통신 ] ================================================================
// 서버에서 ws통신을 통해 front와 back이 연결된다.
// socket으로 받아온 정보는, 연결된 서버에 대한 정보를 담고있다.
const backSocket = new WebSocket(`ws://${window.location.host}`)


backSocket.addEventListener('open', () => {
    console.log('서버에 연결 😎')
})

backSocket.addEventListener('close', () => {
    console.log('서버와 연결 끊김 🥵')
})


// ================================================================ [ WS: messageform submit 이벤트를 통한 메시지 값 서버로 보내기 ] ================================================================

function handleFormSubmit(event){
    event.preventDefault()// 창 새로고침 방지
    const input = messageForm.querySelector('input')
    backSocket.send(makeMessage('new_message', input.value))//backSocket으로 input.value 값을 보낸다.
    input.value =''
}

messageForm.addEventListener('submit', handleFormSubmit)



// ================================================================ [ WS: nickform submit 이벤트를 통한 닉네임 값 서버로 보내기 ] ================================================================
function handleNickSubmit(event){
    event.preventDefault()
    const input = nickForm.querySelector('input')
    backSocket.send(makeMessage('nickname',input.value)) 
}


nickForm.addEventListener('submit', handleNickSubmit)





// ================================================================ [ WS: backSocket으로부터 받은 메시지를 li태그에 추가 ] ================================================================

backSocket.addEventListener('message', (message) => {
    const li = document.createElement('li')
    li.innerText = message.data // message.data li태그에 추가
    messageList.appendChild(li)
})


















