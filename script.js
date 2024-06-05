const firebaseConfig = {
  apiKey: "AIzaSyB5Cb1X6xrpKTullZZDV1S8A700uIzm3Ws",
  authDomain: "easyvent-85031.firebaseapp.com",
  projectId: "easyvent-85031",
  storageBucket: "easyvent-85031.appspot.com",
  messagingSenderId: "496483041148",
  appId: "1:496483041148:web:e7410ac120211c05232ef9",
  measurementId: "G-XMEKKNRMG7"
};

// Ensure Firebase is initialized only once
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Initialize Firestore
const firestore = firebase.firestore();

// Initialize persistence
firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL)
  .then(() => {
    console.log("Firebase persistence initialized successfully");
  })
  .catch((error) => {
    console.error("Error initializing Firebase persistence:", error);
  });

  function displayGreeting(user) {
    const firstName = user.displayName.split(' ')[0].charAt(0).toUpperCase() + user.displayName.split(' ')[0].slice(1);
    const now = new Date();
    const hour = now.getHours();
  
    let greeting;
  
    // Choose greeting based on time of day
    if (hour >= 5 && hour < 12) {
      greeting = `👋Good morning, ${firstName}!`;
    } else if (hour >= 12 && hour < 18) {
      greeting = `👋Good afternoon, ${firstName}!`;
    } else {
      greeting = `👋Good evening, ${firstName}!`;
    }
  
    document.getElementById('greetings').textContent = greeting;
  }
  
  
// Google Sign-In Provider
const googleProvider = new firebase.auth.GoogleAuthProvider();
function signInWithGoogle() {
  firebase.auth().signInWithPopup(googleProvider)
    .then((result) => {
      const user = result.user;
      console.log("User ID:", user.uid);
      displayUserInfo(user);
      displayGreeting(user);  // Add this line
      const userDocRef = firestore.collection('users').doc(user.uid);
      userDocRef.set({
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL
      }, { merge: true }).then(() => {
        console.log("User document created/updated successfully");
      }).catch((error) => {
        console.error("Error creating/updating user document:", error);
      });
    })
    .catch((error) => {
      console.error(error);
    });
}

function displayUserInfo(user) {
  document.getElementById('userName').textContent = user.displayName;
  document.getElementById('userEmail').textContent = user.email;
  document.getElementById('userImage').src = user.photoURL;
}


// Function to handle event posting
function postEvent(title, description, date, imageUrl, location, maxCapacity) {
  const eventsCollection = firestore.collection('events');
  eventsCollection.add({
    title: title,
    description: description,
    date: date,
    imageUrl: imageUrl,
    location: location, // Include location in the event data
    maxCapacity: maxCapacity, // Include max capacity in the event data
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    author: firebase.auth().currentUser.displayName,
    authorUid: firebase.auth().currentUser.uid,
    likes: {}, // Initialize likes as an empty object
    comments: [], // Initialize comments array
    votes: {}, // Initialize votes as an empty object
    verified: false // Initialize as not verified
  }).then(() => {
    alert("Event posted successfully!");
    eventForm.reset();
    eventForm.style.display = 'none';
    displayEvents();
  }).catch((error) => {
    console.error("Error posting event:", error);
  });
}

function voteEvent(eventId) {
const userId = firebase.auth().currentUser.uid;
const eventRef = firestore.collection('events').doc(eventId);

eventRef.get().then((doc) => {
  if (doc.exists) {
    const eventData = doc.data();
    const votes = eventData.votes || {};
    if (votes[userId]) {
      delete votes[userId]; // Remove vote if already voted
    } else {
      votes[userId] = true; // Add vote
    }
    const newVotesCount = Object.keys(votes).length;
    eventRef.update({ 
      votes: votes, 
      votesCount: newVotesCount,
      verified: newVotesCount >= 3 // Verification threshold is now 3 votes
    });
  } else {
    console.error("No such document!");
  }
}).catch((error) => {
  console.error("Error getting document:", error);
});
}
function displayUserInfo(user) {
  const displayName = user.displayName.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

  document.getElementById('user-img').src = user.photoURL;
  document.getElementById('username').textContent = displayName;
  document.getElementById('email').textContent = user.email;
  document.getElementById('loginButton').style.display = 'none';
  document.getElementById('userInfo').style.display = 'flex';

  const userProfileLink = document.getElementById('user-img');
  userProfileLink.href = `/profile.html?uid=${user.uid}`;
}

// Function to handle sign-out
function signOut() {
  firebase.auth().signOut()
    .then(() => {
      document.getElementById('loginButton').style.display = 'block';
      document.getElementById('userInfo').style.display = 'none';
      location.reload(); // Refresh the page upon logout
    })
    .catch((error) => {
      console.error(error);
    });
}

// Add event listener to Google login button
document.addEventListener('DOMContentLoaded', () => {
  const loginButton = document.getElementById('loginButton');
  const logOutButton = document.getElementById('logOut');

  if (loginButton) {
    loginButton.addEventListener('click', signInWithGoogle);
  }

  if (logOutButton) {
    logOutButton.addEventListener('click', signOut);
  }
  
  const attendeeLimitInput = document.getElementById('attendeeLimit');
  const notLimitedCheckbox = document.getElementById('notLimitedCheckbox');

  // Add event listener to the attendee limit input
  attendeeLimitInput.addEventListener('input', () => {
      if (notLimitedCheckbox.checked) {
          notLimitedCheckbox.checked = false; // Uncheck "Not Limited" checkbox if user types a number
      }
  });

  // Add event listener to the "Not Limited" checkbox
  notLimitedCheckbox.addEventListener('change', () => {
      if (notLimitedCheckbox.checked) {
          attendeeLimitInput.disabled = true; // Disable attendee limit input field
          attendeeLimitInput.value = ''; // Clear the value
      } else {
          attendeeLimitInput.disabled = false; // Enable attendee limit input field
      }
  });

  // Listen for authentication state changes
  firebase.auth().onAuthStateChanged((user) => {
    if (user) {
      displayUserInfo(user);
      displayGreeting(user);  // Add this line
      displayEvents();
    } else {
      document.getElementById('loginButton').style.display = 'block';
      document.getElementById('userInfo').style.display = 'none';
    }
  });

// script.js
const sidebar = document.getElementById('sidebar');
const mainContent = document.getElementById('content');

let isPinned = false;

sidebar.addEventListener('mouseenter', () => {
  if (!isPinned) {
      sidebar.classList.remove('collapsed');
      mainContent.classList.add('expanded');
  }
});

sidebar.addEventListener('mouseleave', () => {
  if (!isPinned) {
      sidebar.classList.add('collapsed');
      mainContent.classList.remove('expanded');
  }
});

  
  const userImg = document.getElementById('user-img');
  const userDetails = document.getElementById('userDetails');
  const createEventButton = document.getElementById('createEventButton');
  const eventForm = document.getElementById('eventForm');
  const postEventButton = document.getElementById('postEventButton');
  const eventPage = document.getElementById('event-page');

  if (userImg) {
    userImg.addEventListener('click', () => {
      window.location.href = '/profile.html'; // Replace with the actual path to your profile page
    });
  }

  
    if (createEventButton) {
      createEventButton.addEventListener('click', () => {
        eventForm.style.display = eventForm.style.display === 'none' || eventForm.style.display === '' ? 'flex' : 'none';
      });
    }
  
    if (closeButton) {
      closeButton.addEventListener('click', () => {
        eventForm.style.display = 'none';
      });
    }

  

  // Add event listener to post event button
  if (postEventButton) {
    postEventButton.addEventListener('click', postEventHandler);
  }
  function postEventHandler() {
    // Get values from the form inputs
    const eventTitle = document.getElementById('eventTitle').value;
    const eventDescription = document.getElementById('eventDescription').value;
    const eventDate = document.getElementById('eventDate').value;
    const eventImage = document.getElementById('eventImage').files[0];
    const eventLocation = document.getElementById('eventLocation').value;
    // Get the attendee limit from the input field
    const attendeeLimit = document.getElementById('attendeeLimit').value;

    // Check if any of the required fields are empty
    if (!eventTitle || !eventDescription || !eventDate || !eventLocation) {
        alert("Please fill in all required fields.");
        return; // Exit the function if any required field is empty
    }

    // Additional check for attendeeLimit if it's not limited
    if (!document.getElementById('notLimitedCheckbox').checked && !attendeeLimit) {
        alert("Please provide the maximum capacity or select 'Not Limited'.");
        return; // Exit the function if max capacity is required and not provided
    }

    // Disable the button to prevent multiple submissions
    const postEventButton = document.getElementById('postEventButton');
    postEventButton.disabled = true;

    // Proceed with posting the event
    if (eventImage) {
        const storageRef = firebase.storage().ref();
        const eventImageRef = storageRef.child(`eventImages/${eventImage.name}`);

        eventImageRef.put(eventImage).then((snapshot) => {
            snapshot.ref.getDownloadURL().then((downloadURL) => {
                // Post the event with the provided data
                postEvent(eventTitle, eventDescription, eventDate, downloadURL, eventLocation, attendeeLimit);
                // Re-enable the button after posting
                postEventButton.disabled = false;
            });
        }).catch((error) => {
            console.error("Error uploading image:", error);
            postEventButton.disabled = false; // Re-enable the button in case of error
        });
    } else {
        // Post the event without an image
        postEvent(eventTitle, eventDescription, eventDate, "", eventLocation, attendeeLimit);
        // Re-enable the button after posting
        postEventButton.disabled = false;
    }
}



  // Function to handle liking or unliking an event
  function likeEvent(eventId) {
    const userId = firebase.auth().currentUser.uid;
    const eventRef = firestore.collection('events').doc(eventId);

    eventRef.get().then((doc) => {
      if (doc.exists) {
        const eventData = doc.data();
        const likes = eventData.likes || {};
        if (likes[userId]) {
          delete likes[userId]; // Unlike the event
        } else {
          likes[userId] = true; // Like the event
        }
        const newLikesCount = Object.keys(likes).length;
        eventRef.update({ likes: likes, likesCount: newLikesCount });
      } else {
        console.error("No such document!");
      }
    }).catch((error) => {
      console.error("Error getting document:", error);
    });
  }

  function sendReport(eventId, commentText, reportReason) {
      const reportsCollection = firestore.collection('reports');
      reportsCollection.add({
        eventId: eventId,
        commentText: commentText,
        reason: reportReason,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      }).then(() => {
        console.log("Report sent successfully!");
      }).catch((error) => {
        console.error("Error sending report:", error);
      });
    }
    

    function deleteComment(eventId, commentText) {
      const eventRef = firestore.collection('events').doc(eventId);
      eventRef.get().then((doc) => {
        if (doc.exists) {
          const comments = doc.data().comments;
          const updatedComments = comments.filter(comment => comment.text !== commentText);
          eventRef.update({ comments: updatedComments });
        }
      }).catch((error) => {
        console.error("Error deleting comment:", error);
      });
    }

  

    function displayEvents() {
      const eventsContainer = document.getElementById('eventsContainer');
      const eventsCollection = firestore.collection('events');
    
      eventsCollection.orderBy('createdAt', 'desc').onSnapshot((snapshot) => {
        eventsContainer.innerHTML = '';
        snapshot.forEach((doc) => {
          const event = doc.data();
          const eventId = doc.id;
          const eventCard = document.createElement('div');
          eventCard.classList.add('event-card');
    
          const eventImage = document.createElement('img');
          eventImage.classList.add('event-image');
          eventImage.src = event.imageUrl || './images/image-not-found.jpg';
          eventImage.style.width = '200px';
          eventImage.style.height = 'auto';
          eventImage.style.backgroundSize = 'cover';
    
          const eventDetails = document.createElement('div');
          eventDetails.classList.add('event-details');
    
          const eventTitle = document.createElement('a');
          eventTitle.classList.add('event-title');
          eventTitle.href = `event.html?eventId=${eventId}`;
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
          eventMaxCapacity.textContent = event.maxCapacity ? `Attendees limit: ${event.maxCapacity}` : 'Not Limited';
    
          const eventAuthor = document.createElement('p');
          eventAuthor.classList.add('event-author');
          eventAuthor.innerHTML = `Author: <a href="/profile.html?uid=${event.authorUid}">${event.author}</a>`;
    
          // Display the number of comments
          const commentsCount = document.createElement('p');
          commentsCount.classList.add('comments-count');
          commentsCount.textContent = `Comments: ${event.comments.length}`;
    
          eventDetails.appendChild(eventTitle);
          eventDetails.appendChild(eventDescription);
          eventDetails.appendChild(eventDate);
          eventDetails.appendChild(eventLocation);
          eventDetails.appendChild(eventMaxCapacity);
          eventDetails.appendChild(eventAuthor);
          eventDetails.appendChild(commentsCount);
    
          eventCard.appendChild(eventImage);
          eventCard.appendChild(eventDetails);
    
          eventsContainer.appendChild(eventCard);
    
          const likeButton = document.createElement('button');
          likeButton.classList.add('like-button');
          likeButton.textContent = `Like (${Object.keys(event.likes).length})`;
          likeButton.addEventListener('click', () => {
            likeEvent(eventId);
          });
    
          eventDetails.appendChild(likeButton);
    
          if (event.author === firebase.auth().currentUser.displayName) {
            const editButton = document.createElement('button');
            editButton.textContent = 'Edit';
            editButton.classList.add('edit-event');
            editButton.addEventListener('click', () => {
              editEvent(eventId, event);
            });
    
            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Delete';
            deleteButton.addEventListener('click', () => {
              if (confirm("Are you sure you want to delete this event?")) {
                deleteEvent(eventId);
              }
            });
    
            eventDetails.appendChild(editButton);
            eventDetails.appendChild(deleteButton);
          }
        });
      }, (error) => {
        console.error("Error in snapshot listener:", error);
      });
    }
    
  function deleteEvent(eventId) {
    firestore.collection('events').doc(eventId).delete()
      .then(() => {
        alert("Event deleted successfully!");
        displayEvents();
      }).catch((error) => {
        console.error("Error deleting event:", error);
      });
  }

  
  function postComment(eventId, comment) {
      const user = firebase.auth().currentUser;
      const eventRef = firestore.collection('events').doc(eventId);
      eventRef.update({
        comments: firebase.firestore.FieldValue.arrayUnion({
          text: comment,
          authorName: user.displayName,
          authorImage: user.photoURL
        })
      }).catch((error) => {
        console.error("Error posting comment:", error);
      });
    }
    
    
    
    function editComment(eventId, oldComment, newComment) {
      const eventRef = firestore.collection('events').doc(eventId);
      eventRef.get().then((doc) => {
        if (doc.exists) {
          const comments = doc.data().comments;
          const commentIndex = comments.findIndex(comment => comment.text === oldComment);
          if (commentIndex > -1) {
            comments[commentIndex].text = newComment;
            eventRef.update({ comments: comments });
          }
        }
      }).catch((error) => {
        console.error("Error updating comment:", error);
      });
    }
    

  function editEvent(eventId, eventData) {
    // Functionality to edit the event
    document.getElementById('eventTitle').value = eventData.title;
    document.getElementById('eventDescription').value = eventData.description;
    document.getElementById('eventDate').value = eventData.date;
    eventForm.style.display = 'flex';

    postEventButton.removeEventListener('click', postEventHandler);
    postEventButton.addEventListener('click', () => updateEvent(eventId));
  }

  function updateEvent(eventId) {
    const updatedTitle = document.getElementById('eventTitle').value;
    const updatedDescription = document.getElementById('eventDescription').value;
    const updatedDate = document.getElementById('eventDate').value;
    const updatedImage = document.getElementById('eventImage').files[0];

    if (updatedImage) {
      const storageRef = firebase.storage().ref();
      const updatedImageRef = storageRef.child(`eventImages/${updatedImage.name}`);

      updatedImageRef.put(updatedImage).then((snapshot) => {
        snapshot.ref.getDownloadURL().then((downloadURL) => {
          firestore.collection('events').doc(eventId).update({
            title: updatedTitle,
            description: updatedDescription,
            date: updatedDate,
            imageUrl: downloadURL,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
          }).then(() => {
            alert("Event updated successfully!");
            eventForm.reset();
            eventForm.style.display = 'none';
            displayEvents();
          }).catch((error) => {
            console.error("Error updating event:", error);
          });
        });
      }).catch((error) => {
        console.error("Error uploading updated image:", error);
      });
    } else {
      firestore.collection('events').doc(eventId).update({
        title: updatedTitle,
        description: updatedDescription,
        date: updatedDate,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }).then(() => {
        alert("Event updated successfully!");
        eventForm.reset();
        eventForm.style.display = 'none';
        displayEvents();
      }).catch((error) => {
        console.error("Error updating event:", error);
      });
    }
  }


  // Sidebar navigation
  const homeButton = document.getElementById('homeButton');
  const eventsButton = document.getElementById('eventsButton');
  const calendarButton = document.getElementById('calendarButton');
  const tournamentsButton = document.getElementById('tournamentsButton');

// Set initial display styles for content sections
document.getElementById('events-content').style.display = 'none';
document.getElementById('calendar-content').style.display = 'none';
document.getElementById('tournaments-content').style.display = 'none';

// Show home content by default
document.getElementById('home-content').style.display = 'block'; // or 'flex' if it's a flex container


  if (homeButton) {
    homeButton.addEventListener('click', () => {
      document.getElementById('home-content').style.display = 'block';
      document.getElementById('events-content').style.display = 'none';
      document.getElementById('calendar-content').style.display = 'none';
      document.getElementById('tournaments-content').style.display = 'none';
    });
  }

  if (eventsButton) {
    eventsButton.addEventListener('click', () => {
      document.getElementById('home-content').style.display = 'none';
      document.getElementById('events-content').style.display = 'flex';
      document.getElementById('calendar-content').style.display = 'none';
      document.getElementById('tournaments-content').style.display = 'none';
        createEventButton.style.display = 'flex';
      displayEvents();
    });
  }

  if (calendarButton) {
    calendarButton.addEventListener('click', () => {
      document.getElementById('home-content').style.display = 'none';
      document.getElementById('events-content').style.display = 'none';
      document.getElementById('calendar-content').style.display = 'block';
      document.getElementById('tournaments-content').style.display = 'none';
    });
  }

  if (tournamentsButton) {
    tournamentsButton.addEventListener('click', () => {
      document.getElementById('home-content').style.display = 'none';
      document.getElementById('events-content').style.display = 'none';
      document.getElementById('calendar-content').style.display = 'none';
      document.getElementById('tournaments-content').style.display = 'block';
    });
  }

  displayEvents();
});

