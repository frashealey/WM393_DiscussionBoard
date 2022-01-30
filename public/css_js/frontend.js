function navOpen() {
    document.getElementById("navpanel").style.width = "280px";
};

function navClose() {
    document.getElementById("navpanel").style.width = "0";
};

function deleteConfirm() {
    let confirmBox = confirm("Confirm deletion?");
    if (confirmBox) {
        return true;
    }
    else {
        return false;
    };
};
