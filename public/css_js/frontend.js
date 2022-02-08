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

// prevents context menu on images
const images = document.getElementsByTagName("img");
for (let i = 0; i < images.length; i++) {
    images[i].addEventListener("contextmenu", event => event.preventDefault(), false);
};

// navigation menu open/close
function navOpen() {
    document.getElementById("navpanel").style.width = "280px";
};

function navClose() {
    document.getElementById("navpanel").style.width = "0";
};

// displays confirmation box when deleting an item
function deleteConfirm() {
    let confirmBox = confirm("Confirm deletion?");
    if (confirmBox) {
        return true;
    }
    else {
        return false;
    };
};

// redirects when user presses cancel on item creation screen
function cancelForm(redirect) {
    window.location = redirect;
    return false;
};
