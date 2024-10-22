import Model from './model.js';

//Global model variable
let model;
let currentDisplayedPosts;
window.onload = function() {
    model = new Model();
    currentDisplayedPosts = [...model.data.posts];
    initButton();
    initCommunities();
    renderPosts(sortNewest([...model.data.posts]), document.querySelector('.posts'));
};

//Temporary search box action when pressing enter
document.getElementById('search-box').addEventListener('keydown', function (event) {
    if (event.key === 'Enter') {
        const query = this.value.trim();
        searchPostsAndComments(query);
        if (query) {
            const searchResults = searchPostsAndComments(query);
            renderSearchResults(searchResults, query);
        } else {
            alert('Please enter a search query.');
        }
    }
  });

//Initialize the functionality of the buttons
function initButton() {
    const newButton = document.querySelector('.top-section-buttons > .newest-btn');
    const oldButton = document.querySelector('.top-section-buttons > .oldest-btn');
    const activeButton = document.querySelector('.top-section-buttons > .active-btn');
    const goHomeButtons = document.querySelectorAll('.go-home');
    const homePage = document.querySelector('.homepage-view');
    const postPage = document.querySelector('.postpage-view');
    const communityPage = document.querySelector('.community-view');
    const postsLists = document.querySelector('.posts');
    const homeButton = document.querySelector('.home-button');
    const newCommunityPage = document.querySelector('.new-community-view');
    const createPostButton = document.getElementById('create-post-btn');
    const newPostPage = document.querySelector(".new-post-view");
    const newCommentView = document.querySelector(".new-comment-view");

    createPostButton.addEventListener('click', () => {
        renderNewPostPage();
    });

    document.getElementById('create-community').addEventListener('click', function() {
        renderNewCommunityView();
      });

    newButton.addEventListener('click', () => {
        const sortedPosts = sortNewest(currentDisplayedPosts);
        renderPosts(sortedPosts, postsLists);
    });

    oldButton.addEventListener('click', () => {
        const sortedPosts = sortOldest(currentDisplayedPosts);
        renderPosts(sortedPosts, postsLists);
    });

    activeButton.addEventListener('click', () => {
        const sortedPosts = sortActive(currentDisplayedPosts);
        renderPosts(sortedPosts, postsLists);
    });

    goHomeButtons.forEach((goHomeButton) => {
      goHomeButton.addEventListener('click', () => {
        currentDisplayedPosts = [...model.data.posts];
        newCommunityPage.style.display = "none";
        homePage.style.display = "initial";
        postPage.style.display = "none";
        communityPage.style.display = "none";
        newPostPage.style.display = "none";
        newCommentView.style.display = "none";
        document.querySelector('.top-section-header h2').textContent = "All Posts"
        renderPosts(sortNewest(currentDisplayedPosts), postsLists);
      });
    });

    homeButton.addEventListener('click', () => {
        currentDisplayedPosts = [...model.data.posts];
        newCommunityPage.style.display = "none";
        homePage.style.display = "initial";
        postPage.style.display = "none";
        communityPage.style.display = "none";
        newCommentView.style.display = "none";
        const topSectionHeader = document.querySelector('.top-section-header h2');
        topSectionHeader.textContent = 'All Posts'; // Reset the header to "All Posts"
        //updatePostCount();
  
        renderPosts(sortNewest(currentDisplayedPosts), postsLists);
      });
}

function sortNewest(posts) {
    return posts.sort((a, b) => b.postedDate - a.postedDate);
}

function sortOldest(posts) {
    return posts.sort((a, b) => a.postedDate - b.postedDate);
}

function getLatestCommentDate(commentIDs) {
    let latestDate = new Date(0);
    commentIDs.forEach(commentID => {
        const comment = model.data.comments.find(c => c.commentID === commentID);
        if (comment) {
            if (new Date(comment.commentedDate) > latestDate) {
                latestDate = new Date(comment.commentedDate);
            }
            if (comment.commentIDs && comment.commentIDs.length > 0) {
                const latestReplyDate = getLatestCommentDate(comment.commentIDs);
                if (latestReplyDate > latestDate) {
                    latestDate = latestReplyDate;
                }
            }
        }
    });
    return latestDate;
}

function sortActive(posts) {
    return posts.sort((a, b) => {
        const latestCommentA = getLatestCommentDate(a.commentIDs);
        const latestCommentB = getLatestCommentDate(b.commentIDs);
        return latestCommentB - latestCommentA;
    });
}

//Takes in posts, listArea (querySelector), community is default
function renderPosts(posts, listArea, community = true) {
    //Remove existing content - not sure whether to use innerHTML or display:none
    listArea.innerHTML = '';
    if (posts.length === 0) {
        listArea.innerHTML = '<p>No results found for your search.</p>';
        return;
    }
    posts.forEach(post => {
        const postElement = document.createElement('div');
        postElement.classList.add('post');
        const commentCount = getTotalCommentCount(post.commentIDs);
        const shortContent = post.content.length > 20 ? post.content.substring(0, 20) + "..." : post.content;
        //const communityName = findCommunityByPostID(post.postID);

        //Not sure if it's necessary for linkFlair or not, this would get linkFlair content
        //const linkFlair = getLinkFlair(post.linkFlairID);
        const linkFlairContent = model.data.linkFlairs.find(f => f.linkFlairID === post.linkFlairID)?.content || '';

        postElement.innerHTML =
        `
        <div class="post-heading">
            ${community ? `<p><span class="bold">Community: </span>${findCommunityByPostID(post.postID)}</p>` : ''}
            <p><span class="bold">Posted by </span>${post.postedBy}</p>
            <p><span class="bold">Posted ${formatTimestamp(post.postedDate)}</p>
        </div>
        <div class="post-body">
            <h3 class="post-title">
                <a href="#" data-post-id="${post.postID}">${post.title}</a>
            </h3>
            ${linkFlairContent === '' ? '' : `<p><span class="bold">Link Flair: </span>${linkFlairContent}</p>`}
            <!-- Only 20 characters of post content -->
            <p><span class="bold">Content: </span>${shortContent}</p>
        </div>
        <div class="post-footer">
            <div class="views-comments">
                <p><span class="bold">Views: </span>${post.views}</p>
                <p><span class="bold">Comments: </span>${commentCount}</p>
            </div>
        </div>

        <div class="border-delimiter"></div>
        `;

        listArea.appendChild(postElement);
    });

    //This might need some fixing
    document.querySelector('.post-count').textContent = `${posts.length} posts`;

    //Enter post when the post title is clicked
    document.querySelectorAll('.post-title a').forEach(link => {
        link.addEventListener('click', function(event) {
            event.preventDefault();
            const postID = this.getAttribute('data-post-id');
            //Goes through main posts dataset and matches postID with the clicked title's postID
            const post = model.data.posts.find(p => p.postID === postID);
            renderPostDetails(post);
        });
    });
}

function findCommunityByPostID(postID) {
    for (let community of model.data.communities) {
        if (community.postIDs.includes(postID)) {
          return community.name;
        }
    }

    return "Unknown Community";
}

function renderPostDetails(post, shouldIncrementViews = true) {
    const postPage = document.querySelector('.postpage-view');
    const homePage = document.querySelector('.homepage-view');
    const communityPage = document.querySelector('.community-view');
    const newCommunityPage = document.querySelector('.new-community-view');
    const newPostPage = document.querySelector('.new-post-view');
    const commentCount = getTotalCommentCount(post.commentIDs);
    const newCommentView = document.querySelector('.new-comment-view');
    newCommentView.style.display = "none";
    newPostPage.style.display = "none";
    newCommunityPage.style.display = "none";
    homePage.style.display = "none";
    communityPage.style.display = "none";
    postPage.style.display = "initial";
    const linkFlairContent = model.data.linkFlairs.find(f => f.linkFlairID === post.linkFlairID)?.content || '';
    
    if (shouldIncrementViews) {
        post.views += 1;
    }

    postPage.innerHTML = 
    `
    <div class="post-page">
        <div class="post-details">
            <div class="post-details-heading">
                <p>
                <span class="bold">In Community: </span>${findCommunityByPostID(post.postID)}
                posted ${formatTimestamp(post.postedDate)}
                </p>
                <p><span class="bold">Posted by: </span>${post.postedBy} </p>
                <p><span class="bold">Post Title: </span>${post.title}<p>
                ${linkFlairContent === '' ? '' : `<p><span class="bold">Link Flair: </span>${linkFlairContent}</p>`}
            </div>
            <div class="post-details-content">
                <p><span class="bold">Content:</span> ${post.content}</p>
            </div>
            <div class="post-details-footer">
                <div class="views-comments">
                    <p><span class="bold">Views: </span>${post.views}</p>
                    <!-- Does comments include replies? -->
                    <p><span class="bold">Comments: </span>${commentCount}</p>
                </div>
            </div>
        </div>    
        <div class="comment">
            <button id="add-comment-btn" class="add-comment-btn">Comment</button>
        </div>
        <div class="border-delimiter"></div>
        <!-- Render comments here -->
        <div class="comments-section">
            <h2>Comments</h2>
        </div>
    </div>
    `;

    const commentsSection = postPage.querySelector('.comments-section');
    //Pass in direct replies to this post
    renderComments(post.commentIDs, commentsSection);

    const addComment = document.getElementById('add-comment-btn');
    const replyButtons = document.querySelectorAll('.reply-btn');

    addComment.addEventListener('click', () => {
        createNewCommentView(false, post);
    });

    replyButtons.forEach((button) => {
        button.addEventListener('click', () => {
            createNewCommentView(true, post, button.getAttribute('data-comment-id'));
        });
    });
    /* Might need for later
    document.getElementById('add-comment-btn').addEventListener('click', () => {

    });
    */
}

function createNewCommentView(reply, post, commentID='') {
    const homePage = document.querySelector('.homepage-view');
    const postPage = document.querySelector('.postpage-view');
    const communityPage = document.querySelector('.community-view');
    const newCommunityView = document.querySelector('.new-community-view');
    const newPostView = document.querySelector('.new-post-view');
    const newCommentView = document.querySelector('.new-comment-view');

    homePage.style.display = "none";
    postPage.style.display = "none";
    communityPage.style.display = "none";
    newCommunityView.style.display = "none";
    newPostView.style.display = "none";
    newCommentView.style.display = "block";

    newCommentView.innerHTML = 
    `
    <div class="entire-comment-view>
        <div class="new-comment-view-header">
            <h2>Create a New Comment</h2>
        </div>
        <div class="comment-main">
            <h3>Add a comment</h3>
            <textarea id="comment-body" maxlength="500" required></textarea>
            <p class="error-message" id="comment-body-error"></p>
        </div>
        <div class="comment-username-body">
            <h3>Username</h3>
            <input type="text" id="comment-username" maxlength="100" required>
            <p class="error-message" id="comment-username-error"></p>
        </div>
        <button class="submit-button button button-hover">Submit Comment</button>
    </div>
    
    `;

    const submitButton = document.querySelector('.submit-button');

    submitButton.addEventListener('click', () => {
        const commentBody = document.getElementById('comment-body').value.trim();
        const username = document.getElementById('comment-username').value.trim();

        let isValid = true;

        if (!commentBody) {
            document.getElementById('comment-body-error').textContent = "Comment body is required.";
            isValid = false;
        } else {
            document.getElementById('comment-body-error').textContent = "";
        }

        if (!username) {
            document.getElementById('comment-username-error').textContent = "Username is required.";
            isValid = false;
        } else {
            document.getElementById('comment-username-error').textContent = "";
        }

        if (isValid && reply) {
            const newComment = {
                commentID: "comment"+(model.data.comments.length+1),
                content: commentBody,
                commentIDs: [],
                commentedBy: username,
                commentedDate: new Date()
            };
            
            model.data.comments.push(newComment);
            const oldComment = model.data.comments.find(c => c.commentID === commentID);
            console.log(oldComment);
            oldComment.commentIDs.push(newComment.commentID);
            
            renderPostDetails(post, false);

        } else if (isValid && !reply) {
            const newComment = {
                commentID: "comment"+(model.data.comments.length+1),
                content: commentBody,
                commentIDs: [],
                commentedBy: username,
                commentedDate: new Date()
            };

            model.data.comments.push(newComment);
            
            //Goes through main posts dataset and matches postID with the clicked title's postID
            const oldPosts = model.data.posts.find(p => p.postID === post.postID);
            oldPosts.commentIDs.push(newComment.commentID);

            renderPostDetails(post, false);
        }

    });
}

function renderComments(commentIDs, parentComment, indentLevel = 0) {
    //Sort by most recent comments/replies
    const sortedCommentIDs = commentIDs.sort((a, b) => {
        const commentA = model.data.comments.find(c => c.commentID === a);
        const commentB = model.data.comments.find(c => c.commentID === b);
        return new Date(commentB.commentedDate) - new Date(commentA.commentedDate);
    });
  
    //Create a div container for each comment
    //Append it to parent comment with indentation if it's a reply
    sortedCommentIDs.forEach(commentID => {
        //Goes through main comment dataset and matches commentID with current comment's ID
        const comment = model.data.comments.find(c => c.commentID === commentID);
        if (comment) {
            const commentElement = document.createElement('div');
            commentElement.classList.add('comment');
            commentElement.style.paddingLeft = `${indentLevel * 20}px`;
            
            commentElement.innerHTML =
            `
            <p><span class="bold">${comment.commentedBy}</span> ${formatTimestamp(comment.commentedDate)}</p>
            <p>${comment.content}</p>
            <button class="reply-btn" data-comment-id="${comment.commentID}">Reply</button>
            `;
            
            parentComment.appendChild(commentElement);
            
            //Comment replies exists and contains atleast one reply
            if (comment.commentIDs && comment.commentIDs.length > 0) {
                renderComments(comment.commentIDs, parentComment, indentLevel + 1);
            }
        }
    });
}

function formatTimestamp(date) {
  const now = new Date();
  const timeDifference = now - date; // Difference in milliseconds

  const seconds = Math.floor(timeDifference / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30); // Approximation
  const years = Math.floor(months / 12); // Approximation

  if (seconds < 60) {
      return `${seconds} seconds ago`;
  } else if (minutes < 60) {
      return `${minutes} minutes ago`;
  } else if (hours < 24) {
      return `${hours} hours ago`;
  } else if (days < 30) {
      return `${days} days ago`;
  } else if (months < 12) {
      return `${months} months ago`;
  } else {
      return `${years} year(s) ago`;
  }
}

function initCommunities() {
    const communityList = document.querySelector('.communities');
    communityList.innerHTML = ''; 
    const communities = [...new Set(model.data.communities.map(c => c.name))]; // Ensure unique communities
    const homePage = document.querySelector('.homepage-view');
    const postPage = document.querySelector('.postpage-view');
    const communityPage = document.querySelector('.community-view');
    // Create buttons for each unique community in the nav bar
    communities.forEach((communityName) => {
      const community = model.data.communities.find(c => c.name === communityName);
      const communityElement = document.createElement('button');
      communityElement.classList.add('community');
      communityElement.classList.add('button');
      communityElement.classList.add('button-hover-gray');
      communityElement.textContent = community.name;
  
      communityElement.addEventListener('click', () => {
        homePage.style.display = "none";
        postPage.style.display = "none";
        communityPage.style.display = "initial";
        renderCommunityPage(community);
      });
      communityList.appendChild(communityElement);
    });
  }
  

function renderCommunityPage(community) {
    const communityView = document.querySelector('.community-view');
  
    // Hide other views and show the community view
    communityView.style.display = "block"; // Show the community view

    //Remember to set communityPage display to none in other functions
    const communityPosts = document.querySelector('.community-posts');
    const communityHeader = document.querySelector('.community-view-header');
    const communityButtons = document.querySelector('.community-top-buttons');
    const headerDelimiter = document.querySelector('.header-delimiter');
    const newCommunityPage = document.querySelector('.new-community-view');
    const newPostPage = document.querySelector('.new-post-view');
    newPostPage.style.display = "none";
    newCommunityPage.style.display = "none";
    const newCommentView = document.querySelector('.new-comment-view');
    newCommentView.style.display = "none";

    communityPosts.innerHTML = '';
    communityButtons.style.display = "initial";

    communityHeader.innerHTML = `
    <h2>${community.name}</h2>
    <p>${community.description}</p>
    <p>Created: ${formatTimestamp(community.startDate)}</p>
    <p>${community.postIDs.length} posts</p>
    `;

    headerDelimiter.style.display = "flex";

    const newButton = document.querySelector('.community-top-buttons > .newest-btn');
    const oldButton = document.querySelector('.community-top-buttons > .oldest-btn');
    const activeButton = document.querySelector('.community-top-buttons > .active-btn');

    //Maps all community postIDs to the appropriate post data set
    //Used to sort and retrieve post information
    const listOfCommunityPosts = community.postIDs.map(post =>
        model.data.posts.find(p => p.postID === post)
    );

    //Add the sort functionality when the button is clicked
    newButton.addEventListener('click', () => {
        const sortedPosts = sortNewest(listOfCommunityPosts);
        renderPosts(sortedPosts, communityPosts, false);
    });

    oldButton.addEventListener('click', () => {
        const sortedPosts = sortOldest(listOfCommunityPosts);
        renderPosts(sortedPosts, communityPosts, false);
    });

    activeButton.addEventListener('click', () => {
        const sortedPosts = sortActive(listOfCommunityPosts);
        renderPosts(sortedPosts, communityPosts, false);
    });

    renderPosts(sortNewest(listOfCommunityPosts), communityPosts, false);
}

function searchPostsAndComments(query) {
    //Obtain all the search terms and split them into array
    const queryWords = query.split(' ').map(word => word.trim());
    const seenComments = new Set();
    const seenPosts = new Set();
    function checkCommentAndReplies(commentID, postID) {
      //if a comment has already been checked no need to check it again and return early
      if (seenComments.has(commentID)) return false;
      //iterate through each comment and returns the comment where the commentID matches the given commentID.
      const comment = model.data.comments.find(c => c.commentID === commentID);
      if (comment && comment.content) {
        seenComments.add(commentID);
        const commentMatches = queryWords.some(word => comment.content.includes(word));
        if (commentMatches && !seenPosts.has(postID)) {
          seenPosts.add(postID);
        }
        //This line recursively calls checkCommentAndReplies for each reply to the comment
        if (comment.commentIDs && comment.commentIDs.length > 0) {
          comment.commentIDs.forEach(replyID => checkCommentAndReplies(replyID, postID));
        }
      }
    }
  
    for (let post of model.data.posts) {
      // Check if either the post title or content contains the search keywords
      const matches = queryWords.some(word =>
        post.title.includes(word) || post.content.includes(word)
      );
      if (matches) {
        seenPosts.add(post.postID);
      }
    }
  
    for (let post of model.data.posts) {
      post.commentIDs.some(commentID => {
        checkCommentAndReplies(commentID, post.postID);
      });
    }
  
    //converts that Set into an array, and go into the postIDs in the array to find ones with matching postID and return them
    const matchingPosts = Array.from(seenPosts).map(postID => model.data.posts.find(p => p.postID === postID));
    return matchingPosts;
  }
  
  function getTotalCommentCount(commentIDs) {
    let count = commentIDs.length;
  
    commentIDs.forEach(commentID => {
        const comment = model.data.comments.find(c => c.commentID === commentID);
        if (comment && comment.commentIDs.length > 0) {
            count += getTotalCommentCount(comment.commentIDs);  // Recursively count replies
        }
    });
    return count;
  }
  
  function updateCount(number){
    document.querySelector('.post-count').textContent = `${number} posts`;
  }
  
  function renderSearchResults(posts, query) {
    const sortedPosts = sortNewest(posts);
    currentDisplayedPosts = sortedPosts;
    const postsLists = document.querySelector('.posts');
    const homePage = document.querySelector('.homepage-view');
    const postPage = document.querySelector('.postpage-view');
    const communityPage = document.querySelector('.community-view');
    const newCommunityPage = document.querySelector('.new-community-view');
    const newPostPage = document.querySelector('.new-post-view');
    const newCommentView = document.querySelector('.new-comment-view');
    newCommentView.style.display = "none";
    newPostPage.style.display = "none";
    newCommunityPage.style.display = "none";
  
    // Switch to homepage view when showing search results
    postPage.style.display = "none";
    homePage.style.display = "initial";
    communityPage.style.display = "none";
  
    postsLists.innerHTML = '';
  
    // Update the header to show the search query
    document.querySelector('.top-section-header h2').textContent = `Results for: "${query}"`;
    updateCount(sortedPosts.length);
  
    if (sortedPosts.length === 0) {
        postsLists.innerHTML = '<p>No results found for your search.</p>';
        updateCount(0);
        return;
    }
  
    // Render the matching posts
    sortedPosts.forEach(post => {
        const postElement = document.createElement('div');
        postElement.classList.add('post');
        const commentCount = getTotalCommentCount(post.commentIDs);
        const shortContent = post.content.length > 20 ? post.content.substring(0, 20) + "..." : post.content;
        const communityName = findCommunityByPostID(post.postID);

        const linkFlairContent = model.data.linkFlairs.find(f => f.linkFlairID === post.linkFlairID)?.content || '';
  
        postElement.innerHTML =
        `
        <div class="post-heading">
            <p><span class="bold">Community: </span>${communityName}</p>
            <p><span class="bold">Posted by </span>${post.postedBy}</p>
            <p><span class="bold">Posted ${formatTimestamp(post.postedDate)}</p>
        </div>
        <div class="post-body">
            <h3 class="post-title">
                <a href="#" data-post-id="${post.postID}">${post.title}</a>
            </h3>
            ${linkFlairContent === '' ? '' : `<p><span class="bold">Link Flair: </span>${linkFlairContent}</p>`}
            <p><span class="bold">Content: </span>${shortContent}</p>
        </div>
        <div class="post-footer">
            <div class="views-comments">
                <p><span class="bold">Views: </span>${post.views}</p>
                <p><span class="bold">Comments: </span>${commentCount}</p>
            </div>
        </div>
        <div class="border-delimiter"></div>
        `;
  
        postsLists.appendChild(postElement);
    });
  
    // Ensure post links work
    document.querySelectorAll('.post-title a').forEach(link => {
        link.addEventListener('click', function(event) {
            event.preventDefault();
            const postID = this.getAttribute('data-post-id');
            const post = model.data.posts.find(p => p.postID === postID);
            renderPostDetails(post);
        });
    });
}

function renderNewCommunityView() {
    // Define communityView correctly
    const communityView = document.querySelector('.new-community-view');
    const homePage = document.querySelector('.homepage-view');
    const postPage = document.querySelector('.postpage-view');
    const communityPage = document.querySelector('.community-view');
    const newPostPage = document.querySelector('.new-post-view');
    const newCommentView = document.querySelector('.new-comment-view');
    newCommentView.style.display = "none";
    newPostPage.style.display = "none";
    homePage.style.display = "none";
    postPage.style.display = "none";
    communityPage.style.display = "none";
    communityView.style.display = "block"; // Show the new community view

    // Clear any previous content in the communityView div
    communityView.innerHTML = '';

    // Create the HTML structure dynamically
    const title = document.createElement('h2');
    title.textContent = 'Create a New Community';

    const nameGroup = document.createElement('div');
    nameGroup.classList.add('input-group');
    nameGroup.innerHTML = `
      <label for="community-name">Community Name:</label>
      <input type="text" id="community-name" maxlength="100" required>
      <p class="error-message" id="community-name-error"></p>
    `;

    const descriptionGroup = document.createElement('div');
    descriptionGroup.classList.add('input-group');
    descriptionGroup.innerHTML = `
      <label for="community-description">Community Description:</label>
      <textarea id="community-description" maxlength="500" required></textarea>
      <p class="error-message" id="community-description-error"></p>
    `;

    const usernameGroup = document.createElement('div');
    usernameGroup.classList.add('input-group');
    usernameGroup.innerHTML = `
      <label for="creator-username">Your Username:</label>
      <input type="text" id="creator-username" maxlength="100" required>
      <p class="error-message" id="creator-username-error"></p>
    `;

    const button = document.createElement('button');
    button.id = 'engender-community-btn';
    button.classList.add('button', 'button-hover');
    button.textContent = 'Engender Community';

    const successMessage = document.createElement('p');
    successMessage.classList.add('success-message');
    successMessage.id = 'success-message';

    // Append all elements to the communityView div
    communityView.appendChild(title);
    communityView.appendChild(nameGroup);
    communityView.appendChild(descriptionGroup);
    communityView.appendChild(usernameGroup);
    communityView.appendChild(button);
    communityView.appendChild(successMessage);

    // Attach the event listener for the button
    button.addEventListener('click', createCommunity);
}
  
function createCommunity() {
    const name = document.getElementById('community-name').value.trim();
    const description = document.getElementById('community-description').value.trim();
    const username = document.getElementById('creator-username').value.trim();
    
    let isValid = true;
    
    // Validate Community Name
    if (!name) {
        document.getElementById('community-name-error').textContent = "Community name is required.";
        isValid = false;
    } else {
        const isDuplicate = model.data.communities.some(community => community.name.toLowerCase() === name.toLowerCase());
        if (isDuplicate) {
            document.getElementById('community-name-error').textContent = "Community name already exists. Please choose a different name.";
            isValid = false;
        } else {
            document.getElementById('community-name-error').textContent = "";
        }
    }
    
    // Validate Community Description
    if (!description) {
        document.getElementById('community-description-error').textContent = "Description is required.";
        isValid = false;
    } else {
        document.getElementById('community-description-error').textContent = "";
    }
    
    // Validate Creator Username
    if (!username) {
        document.getElementById('creator-username-error').textContent = "Username is required.";
        isValid = false;
        } else {
        document.getElementById('creator-username-error').textContent = "";
        }
        
        // If all inputs are valid, create the new community
        if (isValid) {
        const newCommunity = {
            name: name,
            description: description,
            creator: username,
            postIDs: [],  // Start with an empty array of posts
            startDate: new Date() // Assign the current date and time
        };
        // Add the new community to the model (assuming model.data.communities exists)
        model.data.communities.push(newCommunity);
        initCommunities();
        // Show success message
        document.getElementById('success-message').textContent = "Community created successfully!";
        setTimeout(() => {
            document.getElementById('success-message').textContent = "";
            renderCommunityPage(newCommunity);
        }, 1000);  // Redirect after 2 seconds
        }
}

function renderNewPostPage() {
    const homePage = document.querySelector('.homepage-view');
    const postPage = document.querySelector('.postpage-view');
    const communityPage = document.querySelector('.community-view');
    const newPostView = document.querySelector('.new-post-view');
    const newCommunityPage = document.querySelector('.new-community-view');
    const newCommentView = document.querySelector('.new-comment-view');
    newCommentView.style.display = "none";
    
    // Hide other views
    newCommunityPage.style.display = "none";
    homePage.style.display = "none";
    postPage.style.display = "none";
    communityPage.style.display = "none";
    newPostView.style.display = "block";
    
    // Clear previous content
    newPostView.innerHTML = '';
    
    // Generate form structure
    const formHTML = `
        <h2>Create a New Post</h2>
        <div class="input-group">
            <label for="community-select">Select Community:</label>
            <select id="community-select" required>
                ${model.data.communities.map(community => `<option value="${community.name}">${community.name}</option>`).join('')}
            </select>
            <p class="error-message" id="community-error"></p>
        </div>
    
        <div class="input-group">
            <label for="post-title">Post Title:</label>
            <input type="text" id="post-title" maxlength="100" required>
            <p class="error-message" id="title-error"></p>
        </div>
    
        <div class="input-group">
            <label for="link-flair-select">Link Flair (optional):</label>
            <select id="link-flair-select">
                <option value=""></option>
                ${model.data.linkFlairs.map(flair => `<option value="${flair.linkFlairID}">${flair.content}</option>`).join('')}
            </select>
            <p>or</p>
            <input type="text" id="new-flair" maxlength="30" placeholder="Enter new flair (optional)">
            <p class="error-message" id="flair-error"></p>
        </div>
    
        <div class="input-group">
            <label for="post-content">Post Content:</label>
            <textarea id="post-content" required></textarea>
            <p class="error-message" id="content-error"></p>
        </div>
    
        <div class="input-group">
            <label for="post-username">Your Username:</label>
            <input type="text" id="post-username" maxlength="100" required>
            <p class="error-message" id="post-username-error"></p>
        </div>
    
        <button id="submit-post-btn" class="button button-hover">Submit Post</button>
        <p class="success-message" id="success-message"></p>
    `;
    newPostView.innerHTML = formHTML;
    // Attach event listener to submit button
    document.getElementById('submit-post-btn').addEventListener('click', submitPost);
}
function submitPost() {
    const communityName = document.getElementById('community-select').value;
    const title = document.getElementById('post-title').value.trim();
    const content = document.getElementById('post-content').value.trim();
    const username = document.getElementById('post-username').value.trim();
    const linkFlair = document.getElementById('link-flair-select').value;
    const newFlair = document.getElementById('new-flair').value.trim();
    
    let isValid = true;
    
    // Validate community selection
    if (!communityName) {
        document.getElementById('community-error').textContent = "Please select a community.";
        isValid = false;
    } else {
        document.getElementById('community-error').textContent = "";
    }
    
    // Validate title
    if (!title) {
        document.getElementById('title-error').textContent = "Post title is required.";
        isValid = false;
    } else {
        document.getElementById('title-error').textContent = "";
    }
    
    // Validate content
    if (!content) {
        document.getElementById('content-error').textContent = "Post content is required.";
        isValid = false;
    } else {
        document.getElementById('content-error').textContent = "";
    }
    
    // Validate username
    if (!username) {
        document.getElementById('post-username-error').textContent = "Username is required.";
        isValid = false;
    } else {
        document.getElementById('post-username-error').textContent = "";
    }
    
    if (isValid) {
        // Add new link flair if specified and if it's not a duplicate
        let isDuplicateFlair;
        let appliedFlair = linkFlair;
        if (newFlair) {
            isDuplicateFlair = model.data.linkFlairs.some(flair => flair.content.toLowerCase() === newFlair.toLowerCase());
            if (isDuplicateFlair) {
                document.getElementById('flair-error').textContent = "Link flair already exists.";
            } else {
                const newFlairID = `lf${model.data.linkFlairs.length + 1}`;
                model.data.linkFlairs.push({ linkFlairID: newFlairID, content: newFlair });
                appliedFlair = newFlairID;
                document.getElementById('flair-error').textContent = "";
            }
        }
    
        // Create new post object if no duplicate flair exists or flair is not required
        if (!newFlair || !isDuplicateFlair) {
            const newPost = {
                postID: `post${model.data.posts.length + 1}`,
                community: communityName, // Store community name directly in the post
                title: title,
                content: content,
                postedBy: username,
                postedDate: new Date(),
                views: 0,
                commentIDs: [],
                linkFlairID: appliedFlair
            };
        
            const community = model.data.communities.find(c => c.name === communityName);
            if (community) {
                community.postIDs.push(newPost.postID);  // Add postID to the community's post list
            }
        
            // Push the new post into the model
            model.data.posts.push(newPost);
        
            // Success message
            document.getElementById('success-message').textContent = "Post created successfully!";
                
            // After 2 seconds, redirect to the homepage
            setTimeout(() => {
                currentDisplayedPosts = [...model.data.posts];
                document.getElementById('success-message').textContent = "";
                renderPosts(sortNewest(currentDisplayedPosts), document.querySelector('.posts'));
                document.querySelector('.new-post-view').style.display = "none";
                document.querySelector('.homepage-view').style.display = "block";
            }, 1000);
        }
    }
}