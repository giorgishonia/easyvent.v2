const firebaseConfig = {
    apiKey: "AIzaSyB5Cb1X6xrpKTullZZDV1S8A700uIzm3Ws",
    authDomain: "easyvent-85031.firebaseapp.com",
    projectId: "easyvent-85031",
    storageBucket: "easyvent-85031.appspot.com",
    messagingSenderId: "496483041148",
    appId: "1:496483041148:web:e7410ac120211c05232ef9",
    measurementId: "G-XMEKKNRMG7"
  };

  firebase.initializeApp(firebaseConfig);
  const firestore = firebase.firestore();

  // Get event ID from URL
  const urlParams = new URLSearchParams(window.location.search);
  const eventId = urlParams.get('eventId');

  function likeEvent(eventId) {
    const eventRef = firestore.collection('events').doc(eventId);
    const user = firebase.auth().currentUser;
  
    eventRef.get().then((doc) => {
      if (doc.exists) {
        const event = doc.data();
        const likes = event.likes || {};
        if (likes[user.uid]) {
          // Unlike the event
          eventRef.update({
            [`likes.${user.uid}`]: firebase.firestore.FieldValue.delete()
          }).catch((error) => {
            console.error("Error unliking event:", error);
          });
        } else {
          // Like the event
          eventRef.update({
            [`likes.${user.uid}`]: user.displayName
          }).catch((error) => {
            console.error("Error liking event:", error);
          });
        }
      }
    }).catch((error) => {
      console.error("Error fetching event:", error);
    });
  }
  

  function postComment(eventId, commentText) {
    const comment = {
      text: commentText,
      authorName: firebase.auth().currentUser.displayName,
      authorUid: firebase.auth().currentUser.uid,
      authorImage: firebase.auth().currentUser.photoURL || './images/profile-picture.jpg',
    };

    firestore.collection('events').doc(eventId).update({
      comments: firebase.firestore.FieldValue.arrayUnion(comment)
    }).then(() => {
      document.querySelector('.comment-input').value = '';
    }).catch((error) => {
      console.error("Error posting comment:", error);
    });
  }

  function editComment(eventId, oldComment, newComment) {
    const eventRef = firestore.collection('events').doc(eventId);
    eventRef.get().then((doc) => {
      if (doc.exists) {
        const event = doc.data();
        const updatedComments = event.comments.map(comment => {
          if (comment.text === oldComment) {
            comment.text = newComment;
          }
          return comment;
        });

        eventRef.update({ comments: updatedComments }).catch((error) => {
          console.error("Error updating comment:", error);
        });
      }
    });
  }

  function deleteComment(eventId, commentText) {
    const eventRef = firestore.collection('events').doc(eventId);
    eventRef.get().then((doc) => {
      if (doc.exists) {
        const event = doc.data();
        const updatedComments = event.comments.filter(comment => comment.text !== commentText);

        eventRef.update({ comments: updatedComments }).catch((error) => {
          console.error("Error deleting comment:", error);
        });
      }
    });
  }

  function sendReport(eventId, commentText, reportReason, reportedUid, reportedName) {
const reportRef = firestore.collection('reports').doc();
reportRef.set({
  eventId,
  commentText,
  reportReason,
  reporterUid: firebase.auth().currentUser.uid,
  reporterName: firebase.auth().currentUser.displayName,
  reportedUid, // Ensure reportedUid is provided
  reportedName, // Ensure reportedName is provided
  timestamp: firebase.firestore.FieldValue.serverTimestamp()
}).catch((error) => {
  console.error("Error sending report:", error);
});
}



function displayEvent(eventId) {
const eventContainer = document.getElementById('eventContainer');
const eventRef = firestore.collection('events').doc(eventId);

eventRef.onSnapshot((doc) => {
  if (doc.exists) {
    const event = doc.data();

    eventContainer.innerHTML = ''; // Clear previous content

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
    eventMaxCapacity.textContent = event.maxCapacity ? `Attendees limit: ${event.maxCapacity}` : 'Not Limited';

    const eventAuthor = document.createElement('p');
    eventAuthor.classList.add('event-author');
    eventAuthor.innerHTML = `Author: <a href="/profile.html?uid=${event.authorUid}">${event.author}</a>`;

    const likeButton = document.createElement('button');
    likeButton.classList.add('like-button');
    likeButton.textContent = `Like (${Object.keys(event.likes).length})`;
    likeButton.addEventListener('click', () => {
      likeEvent(eventId);
    });

    // Update the like button text in real-time
    eventRef.onSnapshot((doc) => {
      const updatedEvent = doc.data();
      likeButton.textContent = `Like (${Object.keys(updatedEvent.likes).length})`;
    });

    const commentForm = document.createElement('form');
    commentForm.classList.add('comment-form');
    commentForm.innerHTML = `
      <input type="text" class="comment-input" placeholder="Write a comment..." required />
      <button type="submit" class="comment-button">Post</button>
    `;
    commentForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const commentInput = commentForm.querySelector('.comment-input');
      postComment(eventId, commentInput.value);
      commentInput.value = '';
    });

    const commentsContainer = document.createElement('div');
    commentsContainer.classList.add('comments-container');
    if (event.comments && event.comments.length > 0) {
      event.comments.forEach(comment => {
        const commentElement = document.createElement('div');
        commentElement.classList.add('comment');

        const authorImage = document.createElement('img');
        authorImage.classList.add('author-image');
        authorImage.src = comment.authorImage || 'https://lh3.googleusercontent.com/a/ACg8ocLtzqCYWvoJG_tOxlxyNN45_YfqvdxIXgnR1dUzQC1UAZSnvNQg=s96-c';
        authorImage.onclick = function() {
          window.location.href = `/profile.html?uid=${event.authorUid}`;
        };

        const authorInfo = document.createElement('div');
        authorInfo.classList.add('author-info');

        const authorName = document.createElement('span');
        authorName.classList.add('author-name');
        authorName.textContent = comment.authorName;
        authorName.onclick = function() {
          window.location.href = `/profile.html?uid=${event.authorUid}`;
        };

        const commentText = document.createElement('span');
        commentText.classList.add('comment-text');
        commentText.textContent = comment.text;

        const tripleDotButton = document.createElement('button');
        tripleDotButton.innerHTML = '⋮'; // Unicode character for triple dot symbol

        tripleDotButton.addEventListener('click', () => {
          const dropdownMenu = commentElement.querySelector('.dropdown-menu');

          if (dropdownMenu.style.display === 'block') {
            dropdownMenu.style.display = 'none';
          } else {
            dropdownMenu.style.display = 'block';
            // Position the dropdown menu above the triple dot button
            dropdownMenu.style.top = `${tripleDotButton.offsetTop - dropdownMenu.clientHeight}px`;
            dropdownMenu.style.left = `${tripleDotButton.offsetLeft}px`;
          }
        });

        const dropdownMenu = document.createElement('div');
        dropdownMenu.classList.add('dropdown-menu');
        dropdownMenu.style.display = 'none';

        const editButton = document.createElement('button');
        editButton.textContent = 'Edit';
        editButton.classList.add('edit-comment');
        editButton.addEventListener('click', () => {
          const newComment = prompt('Edit your comment:', comment.text);
          if (newComment) {
            editComment(eventId, comment.text, newComment);
          }
        });

        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        deleteButton.classList.add('delete-comment');
        deleteButton.addEventListener('click', () => {
          if (confirm("Are you sure you want to delete this comment?")) {
            deleteComment(eventId, comment.text);
          }
        });

        const reportButton = document.createElement('button');
        reportButton.textContent = 'Report';
        reportButton.classList.add('report-comment');
        reportButton.addEventListener('click', () => {
          const reportForm = document.createElement('div');
          reportForm.classList.add('report-form');
          reportForm.innerHTML = `
              <input type="text" id="reportReason" placeholder="Enter reason for report..." required />
              <button id="sendReport">Send</button>
          `;

          const sendReportButton = reportForm.querySelector('#sendReport');
          sendReportButton.addEventListener('click', () => {
              const reportReason = reportForm.querySelector('#reportReason').value;
              sendReport(eventId, comment.text, reportReason, comment.authorUid, comment.authorName);
              reportForm.remove();
          });

          document.body.appendChild(reportForm);
        });



        dropdownMenu.appendChild(editButton);
        dropdownMenu.appendChild(deleteButton);
        dropdownMenu.appendChild(reportButton);

        authorInfo.appendChild(authorName);
        authorInfo.appendChild(commentText);
        commentElement.appendChild(authorImage);
        commentElement.appendChild(authorInfo);
        commentElement.appendChild(tripleDotButton);
        commentElement.appendChild(dropdownMenu);

        commentsContainer.appendChild(commentElement);
      });
    }
    
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
    eventDetails.appendChild(likeButton);
    eventDetails.appendChild(commentForm);
    eventDetails.appendChild(commentsContainer);

    eventCard.appendChild(eventImage);
    eventCard.appendChild(eventDetails);

    eventContainer.appendChild(eventCard);
  } else {
    console.error("No such document!");
  }
}, (error) => {
  console.error("Error fetching event:", error);
});
}

// Display the event when the page loads
window.onload = function() {
displayEvent(eventId);
};
