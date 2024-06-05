const firebaseConfig = {
    apiKey: "AIzaSyB5Cb1X6xrpKTullZZDV1S8A700uIzm3Ws",
    authDomain: "easyvent-85031.firebaseapp.com",
    projectId: "easyvent-85031",
    storageBucket: "easyvent-85031.appspot.com",
    messagingSenderId: "496483041148",
    appId: "1:496483041148:web:e7410ac120211c05232ef9",
    measurementId: "G-XMEKKNRMG7"
  };
  
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
  
  const firestore = firebase.firestore();
  
  function getUserUidFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get('uid');
  }
  
  function displayUserProfile(userUid) {
    const userDocRef = firestore.collection('users').doc(userUid);
  
    userDocRef.get().then((doc) => {
      if (doc.exists) {
        const userData = doc.data();
        document.getElementById('profile-img').src = userData.photoURL || 'default-profile.png';
        document.getElementById('profile-name').textContent = userData.displayName || 'Anonymous';
        document.getElementById('profile-email').textContent = userData.email || 'No email provided';
      } else {
        console.error("No such user document!");
        document.getElementById('profile-name').textContent = 'No such user found';
      }
    }).catch((error) => {
      console.error("Error getting user document:", error);
    });
  }
  
  function displayUserEvents(userUid) {
    const eventsContainer = document.getElementById('eventsContainer');
    const eventsCollection = firestore.collection('events').where('authorUid', '==', userUid);
  
    eventsCollection.get().then((querySnapshot) => {
      eventsContainer.innerHTML = '';
      if (querySnapshot.empty) {
        eventsContainer.textContent = 'No events found for this user.';
        return;
      }
      querySnapshot.forEach((doc) => {
        const event = doc.data();
        const eventCard = document.createElement('div');
        eventCard.classList.add('event-card');
  
        const eventImage = document.createElement('img');
        eventImage.classList.add('event-image');
        eventImage.src = event.imageUrl || './images/image-not-found.jpg';
        eventImage.style.width = '200px';
        eventImage.style.height = 'auto';
  
        const eventDetails = document.createElement('div');
        eventDetails.classList.add('event-details');
  
        const eventTitle = document.createElement('h2');
        eventTitle.classList.add('event-title');
        eventTitle.textContent = event.title;
  
        const eventDescription = document.createElement('p');
        eventDescription.classList.add('event-description');
        eventDescription.textContent = event.description;
  
        const eventDate = document.createElement('p');
        eventDate.classList.add('event-date');
        const eventDateObj = new Date(event.date);
        eventDate.textContent = eventDateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  
        const eventLocation = document.createElement('p');
        eventLocation.classList.add('event-location');
        eventLocation.innerHTML = `Location: <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}" target="_blank">${event.location}</a>`;
  
        const eventMaxCapacity = document.createElement('p');
        eventMaxCapacity.classList.add('event-max-capacity');
        eventMaxCapacity.textContent = `Max Capacity: ${event.maxCapacity}`;
  
        eventDetails.appendChild(eventTitle);
        eventDetails.appendChild(eventDescription);
        eventDetails.appendChild(eventDate);
        eventDetails.appendChild(eventLocation);
        eventDetails.appendChild(eventMaxCapacity);
  
        eventCard.appendChild(eventImage);
        eventCard.appendChild(eventDetails);
  
        eventsContainer.appendChild(eventCard);
      });
    }).catch((error) => {
      console.error("Error getting user events:", error);
    });
  }
  
  document.addEventListener('DOMContentLoaded', () => {
    const userUid = getUserUidFromURL();
    if (userUid) {
      displayUserProfile(userUid);
      displayUserEvents(userUid);
    } else {
      console.error("No user UID provided in URL");
    }
  });