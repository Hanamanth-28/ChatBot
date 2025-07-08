// Utility: Transform triple-backtick code segments into HTML code blocks.
function parseMessage(message) {
    // Use regex to match content between triple backticks
    return message.replace(/```([\s\S]*?)```/g, function(match, codeContent) {
      return `<pre class="code-block"><code>${codeContent.trim()}</code></pre>`;
    });
  }
  
  // Function to add a copy button to code blocks
  function addCopyButtons(container) {
    const codeBlocks = container.querySelectorAll('pre.code-block');
    codeBlocks.forEach(block => {
      // Avoid adding multiple buttons
      if (block.querySelector('.copy-btn')) return;
      const btn = document.createElement('button');
      btn.className = 'copy-btn';
      btn.textContent = 'Copy';
      btn.addEventListener('click', () => {
        const codeText = block.innerText;
        navigator.clipboard.writeText(codeText)
          .then(() => {
            btn.textContent = 'Copied!';
            setTimeout(() => { btn.textContent = 'Copy'; }, 2000);
          })
          .catch(err => {
            console.error('Failed to copy code: ', err);
          });
      });
      block.appendChild(btn);
    });
  }
  
  document.getElementById('send-button').addEventListener('click', sendMessage);
  document.getElementById('user-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
  });
  
  function sendMessage() {
    const inputField = document.getElementById('user-input');
    const message = inputField.value.trim();
    if (!message) return;
    
    addMessageToChat("You", message);
    
    fetch('/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message })
    })
    .then(response => response.json())
    .then(data => {
      if(data.error) {
        addMessageToChat("Error", data.error);
      } else {
        addMessageToChat("Bot", data.response);
      }
    })
    .catch(error => {
      addMessageToChat("Error", "Something went wrong!");
      console.error('Error:', error);
    });
    
    inputField.value = '';
  }
  
  function addMessageToChat(sender, message) {
    const chatBox = document.getElementById('chat-box');
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', sender.toLowerCase());
    
    // If the message is from the bot, run it through the parser to convert code blocks.
    let parsedMessage = (sender === "Bot") ? parseMessage(message) : message;
    messageDiv.innerHTML = `<strong>${sender}:</strong> ${parsedMessage}`;
    
    chatBox.appendChild(messageDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
    
    // If the bot's message contains code blocks, add copy buttons.
    if (sender === "Bot") {
      addCopyButtons(messageDiv);
    }
  }
  