export function showErrorNotification(title, message, details) {
   const notification = document.createElement('div');
   notification.className = 'error-notification';
   notification.innerHTML = `
      <div class="notification-content">
         <h3>${title}</h3>
         <p>${message}</p>
         ${details ? `
         <details>
            <summary>Technical Details</summary>
            <pre>${details}</pre>
         </details>
         ` : ''}
         <button class="close-notification-btn">Close</button>
      </div>
   `;

   document.body.appendChild(notification);

   notification.querySelector('.close-notification-btn').addEventListener('click', () => {
      notification.remove();
   });

   return notification;
}

export function showInvitationUI(roomId) {
   // Remove existing invitation UI if any
   const existing = document.getElementById('invitation-ui');
   if (existing) {
      existing.remove();
   }

   // Create invitation UI container
   const invitationUI = document.createElement('div');
   invitationUI.id = 'invitation-ui';
   invitationUI.className = 'invitation-container';

   const invitationUrl = `${window.location.origin}${window.location.pathname}?room=${roomId}`;

   invitationUI.innerHTML = `
      <div class="invitation-content">
         <div class="room-status">
            <span class="status-label">Room:</span>
            <span class="room-code">${roomId}</span>
         </div>
         <div class="invitation-link">
            <input type="text" readonly value="${invitationUrl}" id="invitation-url-input">
            <button id="copy-invitation-btn">Copy Link</button>
         </div>
         <div class="peer-status" id="peer-status">Waiting for peer...</div>
         <button id="close-invitation-btn">Close</button>
      </div>
   `;

   document.body.appendChild(invitationUI);

   // Copy button functionality
   document.getElementById('copy-invitation-btn').addEventListener('click', () => {
      const input = document.getElementById('invitation-url-input');
      input.select();
      input.setSelectionRange(0, 99999); // For mobile devices

      navigator.clipboard.writeText(invitationUrl).then(() => {
         const btn = document.getElementById('copy-invitation-btn');
         const originalText = btn.textContent;
         btn.textContent = 'Copied!';
         setTimeout(() => {
            btn.textContent = originalText;
         }, 2000);
      }).catch(err => {
         console.error('Failed to copy:', err);
      });
   });

   // Close button functionality
   document.getElementById('close-invitation-btn').addEventListener('click', () => {
      invitationUI.remove();
   });
}

export function showRoomFullNotification(roomId) {
   // Create notification
   const notification = document.createElement('div');
   notification.className = 'room-full-notification';
   notification.innerHTML = `
      <div class="notification-content">
         <h3>Room Full</h3>
         <p>The room <strong>${roomId || 'you tried to join'}</strong> is already full (2/2 participants).</p>
         <p>Please ask the room creator for a new invitation link.</p>
         <button id="close-notification-btn">Close</button>
      </div>
   `;

   document.body.appendChild(notification);

   document.getElementById('close-notification-btn').addEventListener('click', () => {
      notification.remove();
   });
}
