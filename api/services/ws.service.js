let notifyClientsRef = null;

const setNotifier = (fn) => {
    notifyClientsRef = fn;
};

const notifyClients = (payload) => {
    if (notifyClientsRef) {
        notifyClientsRef(payload);
    }
};

module.exports = { 
    setNotifier, 
    notifyClients
}