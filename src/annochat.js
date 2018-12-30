
var password = "";
var address = "";
var contact = {};
var chatlist = {};
var curChat = "";
var lastIndex = -1;
function unlock() {
  web3.eth.personal.unlockAccount(address, password, 600, function (err) {
    if (err) {
      alert("something wrong happened, please refresh the page and try to login again");
      password = "";
      address = "";
    }
  });
}

function loadContactList() {
  ac.methods.getContactListSize().call({ from: address }, function (err, res) {
    if (!err) {
      for (i = 0; i < res; i++) {
        ac.methods.getContactList(i).call({ from: address }, function (err1, res1) {
          if (!err1) {
						newContact(res1['0'].toLowerCase(), res1['1']);
          }
        });
			}
			
    } else {
      alert("something wrong happened, please refresh the page and try to login again");
    }
  });
}

function loadChatList(){
	var len = chatlist[curChat].length;
	for (i = 0; i < len; i++){
		var info = chatlist[curChat][i]['info'];
		var sender = chatlist[curChat][i]['sender'];
		newChat(info,sender);
	}
}
function isNotifyNewInfo(text) {
  if (text.length < 5) return false;
  return (text.substring(text.length - 5) === '(new)');
}
function afterGetNewInfo(content, timestamp, addr, addr_recv) {
  ac.methods.AfterNewInfo().send({ from: address, gas: 3000000 }, function (error, transactionHash) {
    if (!error) {
			console.log(transactionHash);
			var isNewContact = false;
			var new_addr = addr;
			if (addr === address)
			{
				if (contact[addr_recv] === undefined) {
					isNewContact = true;
				}
				new_addr = addr_recv;
			} else {
				if (contact[addr] === undefined) {
					isNewContact = true;
				}
			}
      if (isNewContact) {
        ac.methods.getName(new_addr).call({ from: address }, function (err, res) {
          if (!err && res != '') {
            newContact(new_addr, res);
            chatlist[new_addr].push({ info: content, ts: timestamp, sender: addr ,reciever: addr_recv});
            if (curChat === new_addr) {
              newChat(content, addr);
            } else {
              name = $('#' + new_addr).text();
              if (!isNotifyNewInfo(name)) $('#' + new_addr).text(name + '(new)');
            }
          }
        });
      } else {
        chatlist[new_addr].push({ info: content, ts: timestamp, sender: addr ,reciever: addr_recv});
        if (curChat === new_addr) {
          newChat(content, addr);
        } else {
          name = $('#' + new_addr).text();
          if (!isNotifyNewInfo(name)) $('#' + new_addr).text(name + '(new)');
        }
      }
    }
  });

}
function checkAndGetNewInfo() {
  ac.methods.getNewInfoSize().call({ from: address }, function (err, res) {
    if (!err && res != 0) {
      ac.methods.getNewInfo().call({ from: address }, function (err1, res1) {
        if (!err1 && res1['4'] != lastIndex) {
          lastIndex = res1['4'];
					afterGetNewInfo(res1['0'], res1['1'], res1['2'].toLowerCase(), res1['3'].toLowerCase());
        } else if(err1){
          console.log(err1);
        }
      });
    }
  });
}
function loginUnlock()
{
	password = $('#password').val();
	address = $('#address').val().toLowerCase();
	web3.eth.personal.unlockAccount(address, password, 600, function (err) {
    if (!err) {
			login();
    } else {
      alert("wrong password or address!");
      password = "";
      address = "";
    }
  });
}
function login() {
	ac.methods.isUserExist(address).call({ from: address },function(error, isExist){
		if (error){
			alert("isUserExist error");
			return;
		}
		if (isExist) {
			window.setInterval(unlock, 590000);
      window.setInterval(checkAndGetNewInfo, 2000);
			$('.contactBox').show();
			$('.loginBox').hide();
			loadContactList();
		} else {
			var nick = prompt("you are not register yet, please input your nickname for annochat","");
			while(nick.length == 0) {
				nick = prompt("you are not register yet, please input your nickname for annochat","");
			}
			ac.methods.register(nick).send({ from: address, gas: 3000000 }, function (serror, transactionHash){
				if (serror){
					alert("error happened when registering")
				} else {
					console.log(transactionHash);
					window.setInterval(unlock, 590000);
					window.setInterval(checkAndGetNewInfo, 2000);
					$('.contactBox').show();
					$('.loginBox').hide();
					loadContactList();
				}
			});
		}
	});
}

function loadOldInfo() {
	alert('here');
	if (curChat == address) return;
  var idx = contact[curChat]['oldInfoSize'] - 1;
  if (idx === -1) {
    alert("No more old message!");
    return;
  }
  ac.methods.getCertainOldInfo(curChat, idx).call({ from: address }, function (err, res) {
    if (!err) {
      chatlist[curChat].unshift({ info: res['0'], ts: res['1'], sender: res['2'].toLowerCase(),reciever: res['3'].toLowerCase() });
			newChatfront(res['0'], res['2'].toLowerCase());
			contact[curChat]['oldInfoSize']--;
    }
  });

}
function newContact(addr, cname = '') {
  if (addr === '' || addr === address) return;
  if (contact[addr] != undefined) return;
  if (cname != '') {
    ac.methods.getCertainOldInfoSize(addr).call({ from: address }, function (err2, certainOldInfoSize) {
      if (!err2) contact[addr] = { name: cname, oldInfoSize: certainOldInfoSize };
    });
    addContact(cname, addr);
  } else {
    ac.methods.getName(addr).call({ from: address }, function (err, nickname) {
      if (!err && nickname != '') {
        ac.methods.getCertainOldInfoSize(addr).call({ from: address }, function (err2, certainOldInfoSize) {
          if (!err2) contact[addr] = { name: nickname, oldInfoSize: certainOldInfoSize };
        });
        addContact(nickname, addr);
      } else {
        alert("check the address, maybe did not register");
      }
    });
  }
  chatlist[addr] = [];
}
function addContact(name, address) {
	$('.contact-thread').append('<li class=\'contactItem\' id=' + address + '>' + name + '</li>');
	$('#'+ address).bind('click',contactOnclick);
}
function newChat(str, addr) {
  if (addr === address) {
    addChat(str, true);
  } else {
    addChat(str, false);
  }
}
function addChat(str, isSelf) {
  if (isSelf) {
    $('.chat-thread').append('<li id=\'self\'>' + str + '</li>');
  }
  else {
    $('.chat-thread').append('<li id=\'other\'>' + str + '</li>');
  }
}

function newChatfront(str, addr) {
  if (addr === address) {
    addChatfront(str, true);
  } else {
    addChatfront(str, false);
  }
}
function addChatfront(str, isSelf) {
  if (isSelf) {
    $('.chat-thread').prepend('<li id=\'self\'>' + str + '</li>');
  }
  else {
    $('.chat-thread').prepend('<li id=\'other\'>' + str + '</li>');
  }
}



function contactOnclick(){
	if (curChat === '') $('.chatBox').show();
	curChat = $(this).attr('id');
	if (curChat.length < 10) {
		alert("error");
		return;
	}
	$('#'+curChat).text(contact[curChat]['name']);
	$('.chat-thread li').remove();
	loadChatList();
}
function addOnclick()
{
  var addr = prompt("input address", "");
  newContact(addr);
}
function sendInfo() {
  var info = $('#typeArea').val();
  if (info === '') {
    alert("empty input");
    return;
  }
  ac.methods.sendTo(curChat, info).send({ from: address, gas: 3000000 }, function (error, transactionHash) {
    if (!error) {
      console.log(transactionHash);
			$('#sendState').text('Send successfully, please wait for a few seconds to see the response');
			$('#typeArea').val("");
			window.setTimeout(function(){
				$('#sendState').text("");
			},1500);
    }else{
			$('#sendState').text('Send Fail, unknown error occured');
		}
  });
}

$(function () {
	if(web3 ==null) {
		alert("can not connect to blockchain!");
	}
  $('.chatBox').hide();
  $('.contactBox').hide();
});