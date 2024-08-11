#!/bin/bash

SESSION_NAME="hailr"  # Choose a name for your tmux session

# Start a new tmux session if it doesn't already exist
tmux has-session -t $SESSION_NAME 2>/dev/null
if [ $? != 0 ]; then
	    tmux new-session -d -s $SESSION_NAME
fi

# Change directory and start Python HTTP server in the tmux session
tmux send-keys -t $SESSION_NAME:0 'cd /home/field/src/hailr' Enter
tmux send-keys -t $SESSION_NAME:0 'python3 -m http.server --bind 10.8.0.41' Enter

