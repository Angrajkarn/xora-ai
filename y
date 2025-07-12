rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    // CHATS
    // Users can:
    // 1. Create a chat if they are the owner.
    // 2. Read/delete chats they are a member of.
    // 3. Update chats (e.g., title, members) securely.
    match /chats/{chatId} {
      allow read, delete: if request.auth != null && 
                             'members' in resource.data &&
                             resource.data.members is list && 
                             request.auth.uid in resource.data.members;

      allow create: if request.auth != null && 
                       request.auth.uid == request.resource.data.ownerId;

      // This rule allows a user to update a chat IF:
      // 1. They will be a member after the update is complete.
      // 2. They are not removing any other members from the chat.
      // This securely handles both joining a chat and updating its title.
      allow update: if request.auth != null &&
                       'members' in resource.data &&
                       resource.data.members is list &&
                       request.auth.uid in request.resource.data.members &&
                       request.resource.data.members.hasAll(resource.data.members);

      // MESSAGES (Direct access by path for members)
      // This allows members of a chat to read and create messages in that chat.
      match /messages/{messageId} {
        allow read, create, delete: if request.auth != null && 
                                     'members' in get(/databases/$(database)/documents/chats/$(chatId)).data &&
                                     get(/databases/$(database)/documents/chats/$(chatId)).data.members is list &&
                                     request.auth.uid in get(/databases/$(database)/documents/chats/$(chatId)).data.members;
        // Disallow updates on individual messages for simplicity.
        allow update: if false;
      }
    }
    
    // MESSAGES (Collection Group access for dashboard)
    // This allows the dashboard query to read all messages belonging to a user.
    // This rule is combined with the one above. A read is allowed if either rule passes.
    match /{path=**}/messages/{messageId} {
      // Users can only read messages from chats they own for analytics purposes.
      allow read: if request.auth != null && 
                   'ownerId' in resource.data && 
                   request.auth.uid == resource.data.ownerId;

      // Disallow any writes through this general collection group rule for security.
      // Writes must happen through the specific path: /chats/{chatId}/messages/{messageId}
      allow write: if false;
    }
    
    // USERS
    // Users can get, create, and update their own preferences document.
    // The document ID must match their authentication UID.
    match /users/{userId} {
        allow get, create, update: if request.auth != null && request.auth.uid == userId;
        // Disallow listing all users or deleting a profile for security.
        allow list, delete: if false;
    }
  }
}


// rules_version = '2';

// service cloud.firestore {
//   match /databases/{database}/documents {

//     // CHATS
//     // Users can:
//     // 1. Create a chat if they are the owner.
//     // 2. Read/delete chats they are a member of.
//     // 3. Update chats (e.g., title, members) securely.
//     match /chats/{chatId} {
//       allow read, delete: if request.auth != null && 
//                              'members' in resource.data &&
//                              resource.data.members is list && 
//                              request.auth.uid in resource.data.members;

//       allow create: if request.auth != null && 
//                        request.auth.uid == request.resource.data.ownerId;

//       // This rule allows a user to update a chat IF:
//       // 1. They will be a member after the update is complete.
//       // 2. They are not removing any other members from the chat.
//       // This securely handles both joining a chat and updating its title.
//       allow update: if request.auth != null &&
//                        'members' in resource.data &&
//                        resource.data.members is list &&
//                        request.auth.uid in request.resource.data.members &&
//                        request.resource.data.members.hasAll(resource.data.members);

//       // MESSAGES (Direct access by path for members)
//       // This allows members of a chat to read and create messages in that chat.
//       match /messages/{messageId} {
//         allow read, create, delete: if request.auth != null && 
//                                      'members' in get(/databases/$(database)/documents/chats/$(chatId)).data &&
//                                      get(/databases/$(database)/documents/chats/$(chatId)).data.members is list &&
//                                      request.auth.uid in get(/databases/$(database)/documents/chats/$(chatId)).data.members;
//         // Disallow updates on individual messages for simplicity.
//         allow update: if false;
//       }
//     }
    
//     // MESSAGES (Collection Group access for dashboard)
//     // This allows the dashboard query to read all messages belonging to a user.
//     // This rule is combined with the one above. A read is allowed if either rule passes.
//     match /{path=**}/messages/{messageId} {
//       // Users can only read messages from chats they own for analytics purposes.
//       allow read: if request.auth != null && 
//                    'ownerId' in resource.data && 
//                    request.auth.uid == resource.data.ownerId;

//       // Disallow any writes through this general collection group rule for security.
//       // Writes must happen through the specific path: /chats/{chatId}/messages/{messageId}
//       allow write: if false;
//     }
    
//     // USERS
//     // Users can get, create, and update their own preferences document.
//     // The document ID must match their authentication UID.
//     match /users/{userId} {
//         allow get, create, update: if request.auth != null && request.auth.uid == userId;
//         // Disallow listing all users or deleting a profile for security.
//         allow list, delete: if false;
//     }
//   }
// }


// rules_version = '2';

// service cloud.firestore {
//   match /databases/{database}/documents {

//     // CHATS
//     // Users can:
//     // 1. Create a chat if they are the owner.
//     // 2. Read, update, and delete chats they are a member of.
//     match /chats/{chatId} {
//       allow read, update, delete: if request.auth != null && request.auth.uid in resource.data.members;
//       allow create: if request.auth != null && request.auth.uid == request.resource.data.ownerId;

//       // MESSAGES
//       // Users can read, create, and delete messages within chats they are a member of.
//       match /messages/{messageId} {
//         allow read, create, delete: if request.auth != null && request.auth.uid in get(/databases/$(database)/documents/chats/$(chatId)).data.members;
//         // Disallow updates on individual messages for simplicity.
//         allow update: if false;
//       }
//     }
    
//     // USERS
//     // Users can get, create, and update their own preferences document.
//     // The document ID must match their authentication UID.
//     match /users/{userId} {
//         allow get, create, update: if request.auth != null && request.auth.uid == userId;
//         // Disallow listing all users or deleting a profile for security.
//         allow list, delete: if false;
//     }
//   }
// }



