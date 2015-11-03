function Sync(options) {

    var _self = this;

    var queryRef = _self.queryRef = new
    Firebase('touchinsight.firebaseIO.com');

    queryRef.on('child_added',
        function (snapshot) {
            //GET DATA
            var data = snapshot.val();

            options.callback(data);

        });
}

Sync.prototype.push = function (query) {

    var _self = this; 
    
    _self.queryRef.push(query);
}