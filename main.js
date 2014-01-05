var photoMap = {
   "markers":[],


"initialize":function() {
       var mapOptions = {
           center: new google.maps.LatLng(37.4419, -102.1419),
           zoom: 5
       };
       photoMap.map = new google.maps.Map(document.getElementById("map"),
               mapOptions);
   },


   "handleStatusChange":function(res) {

       document.body.className = res.authResponse ? 'connected' : 'not_connected';

       if (res.authResponse) {
           photoMap.token = res.authResponse.accessToken;
           photoMap.getUserFriends();
       }
   },


  "getUserFriends":function() {
      var url = '/me/friends?fields=name,picture&access_token=' + photoMap.token

      FB.api(url, function(response) {
          if (!response.error) {
              var markup = '';
              var friends = response.data;
              var len = friends.length;

              for (var i=0; i < len; i++) {
                var friend = friends[i];
                markup += '<img src="' + friend.picture.data.url + '" title="'+friend.name+'" id="'+friend.id+'" />';
                //markup += '<button class="photos" title="'+friend.id+'">get photos</button><span class="number"></span><input type="checkbox" /><img src="' + friend.picture.data.url + '" />' + friend.name + '<br /><br />';
              }
              $('article').html('<div style="overflow:auto; height:'+$('#map').height()+'px">'+markup+'</div>').find('img').click(function(e){
                  $(this).toggleClass('selected');
                  photoMap.getUserPhotos($(this).attr('id'));
              });
          }
      });
  },

   "getUserPhotos":function(id) {
       var url = '/'+id+'/albums?fields=photos&access_token=' + photoMap.token;
       var photoset = [];
       var $el = $('img[id="'+id+'"]');
       var data = $.data($el[0]);

       if(data.photos && data.photos.length > 0) {
           photoMap.placeMarker();
       }

       else {
           FB.api(url, function(res){

               if(res.data.length > 0) {

                   $.each(res.data, function(key, album){

                       // checks against empty albums
                       if(!album.photos){return true;}

                       $.each(album.photos.data, function(ind, photo) {
                           if(photo.place && photo.place.location) {

                               // check image height to be around 300 - 400 px 
                               // var point = [photo.place.name, photo.place.location.longitude, photo.place.location.latitude, 5];

                               data = {
                                   "name":photo.place.name,
                                   "lng":photo.place.location.longitude,
                                   "lat":photo.place.location.latitude,
                                   "src":photo.images[3].source
                               }

                               photoset.push(data);

                           }

                       })
                   });

               }

               if (photoset.length !== 0) {
                   $.data($el[0], 'photos', photoset);
               }

               photoMap.placeMarker();
           });
       }
   },



   "placeMarker":function() {
       function createMarker(photoset) {

           var markers = [];
           $.each(photoset, function(i) {
               var latlng = new google.maps.LatLng(this.lat, this.lng);

               var marker = new google.maps.Marker({
                   position: latlng,
                   map: photoMap.map,
                   animation: google.maps.Animation.DROP,
                   title: 'Hello World!'
               });

               var contentString = this.name +'<br /><img src="'+this.src+'" />';

               var infowindow = new google.maps.InfoWindow({
                   content: contentString
               });

               google.maps.event.addListener(marker, 'click', function() {

                   if(photoMap.infowindow) {
                       photoMap.infowindow.close();
                   }

                   photoMap.infowindow = infowindow;
                   infowindow.open(photoMap.map, marker);
               });
           });
       }
       $('article img.selected').each(function(){
           var photos = $.data(this).photos;
           if(photos){
               createMarker(photos);                
           }
       });
  },

  "loginUser":function() {
      FB.login(function(response) { }, {"scope":"read_friendlists,user_photos,friends_photos"});
  },


  "_init":function() {
      $('#login').find('button').click(photoMap.loginUser);     
  }
}

photoMap._init();

google.maps.event.addDomListener(window, 'load', photoMap.initialize);