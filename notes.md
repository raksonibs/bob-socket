- need to check for games with same game type, that have a status of waiting, this is being queried
- on start matchmaking in ember app, we emit a query search for matchmaker, which runs a settimeout to continually query looking for another game,
  - once successful, we create a match on rails api, and emit an event to the client that you can join the two games, where the client then creates a match with the data from the emit event

  - the emberapp then creates, and we stop settingtimeout, and it goes back to listening, it has to listen all the time mindyou