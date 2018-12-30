pragma solidity ^0.4.0;
contract AnonChat {
    struct chatinfo{
        string info;
        uint timestamp;
        address sender;
        address reciever;
    }
    struct chatinfo_store{
        uint[] idx;
        bool isExist;
    }
    struct profile{
        string nickname;
        bool isExist;
        address [] contact;
        chatinfo [] recv;
        string [] send;
        uint read;
        mapping(address => chatinfo_store)  contact_map;
    }
    mapping(address => profile) private prof_map;
    address [] addr_pool;
    function isUserExist(address user) view public returns(bool){
        return prof_map[user].isExist == true;
    }
    function register(string name) public returns(bool){

        if(prof_map[msg.sender].isExist == true){
            return false;
        }
        addr_pool.push(msg.sender);
        prof_map[msg.sender].isExist=true;
        prof_map[msg.sender].nickname=name;
        return true;

    }
    function getName(address addr) view public returns(string)
    {
        return prof_map[addr].nickname;
    }
    function getContactListSize() view public returns(uint){
        return prof_map[msg.sender].contact.length;
    }
    function getContactList(uint idx) view public returns(address,string){
        address addr = prof_map[msg.sender].contact[idx];
        return (addr,prof_map[addr].nickname);
    }
    function getNewInfoSize() view public returns(uint){
        return prof_map[msg.sender].recv.length-prof_map[msg.sender].read;
    }
    function getNewInfo() view public returns(string,uint,address,address,uint){
        if (!isUserExist(msg.sender) || getNewInfoSize() == 0) {
            return ("",0,msg.sender,msg.sender,0);
        }
        address sender = prof_map[msg.sender].recv[idx].sender;
        address reciever = prof_map[msg.sender].recv[idx].reciever;
        uint idx = prof_map[msg.sender].read;
        return (prof_map[msg.sender].recv[idx].info,prof_map[msg.sender].recv[idx].timestamp,sender,reciever,idx);
    }
    function AfterNewInfo()  public {
        if (getNewInfoSize() == 0) return;
        uint idx = prof_map[msg.sender].read;
        prof_map[msg.sender].read++;
        address sender = prof_map[msg.sender].recv[idx].sender;
        address reciever = prof_map[msg.sender].recv[idx].reciever;
        if (sender == msg.sender){
            prof_map[msg.sender].contact_map[reciever].idx.push(idx);
        } else {
            prof_map[msg.sender].contact_map[sender].idx.push(idx);
        }
    }
    function getOldInfoSize() view public returns(uint){
        return prof_map[msg.sender].read;
    }
    function getOldInfo(uint idx) view public returns(string,uint,address){
        if (!isUserExist(msg.sender) || idx >= prof_map[msg.sender].read) {
            return ("",0,msg.sender);
        }
        return (prof_map[msg.sender].recv[idx].info,prof_map[msg.sender].recv[idx].timestamp,prof_map[msg.sender].recv[idx].sender);
    }
    function sendTo(address addr,string info) public returns(bool){
        if (!isUserExist(msg.sender) || !isUserExist(addr) || addr == msg.sender ){
            return false;
        }
        bool existInContact = prof_map[msg.sender].contact_map[addr].isExist;
        if (!existInContact){
            prof_map[msg.sender].contact.push(addr);
            prof_map[msg.sender].contact_map[addr].isExist = true;
            prof_map[addr].contact.push(msg.sender);
            prof_map[addr].contact_map[msg.sender].isExist = true;
        }
        chatinfo memory new_chat = chatinfo(info,now,msg.sender,addr);
        prof_map[addr].recv.push(new_chat);
        prof_map[msg.sender].recv.push(new_chat);
        return true;
    }
    function getCertainOldInfoSize(address addr) view public returns(uint){
        if (!prof_map[msg.sender].contact_map[addr].isExist) {
            return 0;
        }
        return prof_map[msg.sender].contact_map[addr].idx.length;
    }
    function getCertainOldInfo(address addr, uint idx) view public returns(string,uint,address,address){
        if (!prof_map[msg.sender].contact_map[addr].isExist || idx >= prof_map[msg.sender].contact_map[addr].idx.length) {
            return ("",0,msg.sender,msg.sender);
        }
        uint real_idx = idx = prof_map[msg.sender].contact_map[addr].idx[idx];
        return (prof_map[msg.sender].recv[real_idx].info,prof_map[msg.sender].recv[real_idx].timestamp,prof_map[msg.sender].recv[real_idx].sender,prof_map[msg.sender].recv[real_idx].reciever);
    }

}