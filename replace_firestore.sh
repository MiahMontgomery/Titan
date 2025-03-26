#!/bin/bash
sed -i 's/getFirestore()/getFirestoreDb()/g' server/firebase.ts
