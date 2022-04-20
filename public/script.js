function onCheck() {
    document.getElementById("signup").toggleAttribute("disabled");
}

function more_info(id) {
    console.log("more_info");
    document.getElementById("more"+id).style.display = "block";
    document.getElementById("original"+id).style.display = "none";
}

function less_info(id) {
    console.log("less_info");
    document.getElementById("more"+id).style.display = "none";
    document.getElementById("original"+id).style.display = "block";
}

const socket = io();             //Socket is connected

function chatuser(myname , chatname){

    console.log("clicked");
    $("#chatbox").toggleClass("chatarea");
    console.log(myname);
    console.log(chatname);


    let textarea = document.querySelector("#textarea");
    let messageArea = document.querySelector(".message_area");
    textarea.addEventListener("keyup" , function(e){
        if(e.key === "Enter") {
            sendMessage(e.target.value);
        }
    });

    function sendMessage(message) {
        let msg = {
            user: myname,
            message: message.trim()
        }

        //Append message
        appendMessage(msg , "outgoing");
        textarea.value = "";
        scrollToBottom();

        //Send message to server via socket
        socket.emit("message" , msg);
    }

    function appendMessage(msg , type) {
        let mainDiv = document.createElement("div");
        let className = type;
        mainDiv.classList.add(className , "message");

        let markup = `<h6><i class="fas fa-user-circle icon"></i>${msg.user}</h6>               
                    <p>${msg.message}</p> `;

        mainDiv.innerHTML = markup;
        console.log("append");
        messageArea.appendChild(mainDiv);
    }

    //Receive messages
    socket.on("message" , function(msg){
        appendMessage(msg , "incoming");
        scrollToBottom();
    });

    function scrollToBottom() {
        messageArea.scrollTop = messageArea.scrollHeight;
    }
};





function sendData(e) {
    const searchResults = document.getElementById("searchResults");
    let match1 = e.value.match(/^[a-zA-Z ]*/);
    let match2 = e.value.match(/\s*/);
    if(match2[0] === e.value) {
        searchResults.innerHTML = "";
        searchResults.style.display = "none";
        return;
    }

    if(match1[0] === e.value) {
        searchResults.style.display = "block";
        fetch("/getUsers" , {
            method: "POST",
            headers: {"Content-Type" : "application/json"},
            body: JSON.stringify({payload : e.value})
        })
        .then(res => res.json())
        .then(data => {
            let payload = data.payload;
            searchResults.innerHTML = "";
    
            if(payload.length < 1) {
                searchResults.innerHTML = "<p class='noresult'>No results found.</p>";
                return;
            }
            payload.forEach((item , index) => {
                if(index > 0) {
                    searchResults.innerHTML += "<hr>";
                }
                console.log(item);
                searchResults.innerHTML += `<p class="searchItems"><a href="/profile/${item._id}">${item.username}</a></p>`;
            });
        });
        return;
    }

    searchResults.innerHTML = "";
}