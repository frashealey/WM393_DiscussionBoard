// auto-expands textarea elements
const textarea = document.getElementsByTagName("textarea");
for (let i = 0; i < textarea.length; i++) {
    textarea[i].setAttribute("style", "height:" + (textarea[i].scrollHeight) + "px; overflow-y: hidden;");
    textarea[i].addEventListener("input", textAreaInput, false);
};

function textAreaInput() {
    this.style.height = "auto";
    this.style.height = (this.scrollHeight) + "px";
};

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

function cancelForm(redirect) {
    window.location = redirect;
    return false;
};
