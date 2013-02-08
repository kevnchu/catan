# Catan
#
# a good design constraint would be to make the game playable without any sort of gui first.
# how to represent board without visualization. Each piece has an id. coordinates on the board are just tuples
# of piece ids.
#
# define all actions:
#
# #### Player actions:
# trade with other players / the board.
# build - involves both paying resources and placing any buildings.
# roll dice
# chat
# use development cards
# choose where to move robber
# choose resources to discard
# end turn
#
# #### board actions:
# distribute resources based on dice roll
#
#
#
#
# Implementation:
#
# distributing resources.
# given a dice roll, need to look up each piece that hits. Then lookup each player who has a building / settlement on
# piece
#
#
# Model:
#
#   player
#     id
#     name
#     settlements
#
#   settlement
#     id
#     position
#     type
#
#   tile
#     id
#     dice value
#     resource type

# things you can build:
# road - 1 wood, 1 brick
# settlement 1 wood, 1 brick, 1 sheep, 1 wheat
# city - 2 wheat, 3 stone
# dev card - 1 sheep, 1 wheat, 1 stone
#
#
# how to handle player actions?
# need to be able to determine if the player is allowed to make action at a certain
# time.
#
# game server pushes update to each player. the player who's turn it is, gets a different
# message that signals the player to take an action. when that player takes an action, it may
# change the state for other players in the game (eg. trading or building or after ending turn).
# when player's turn ends, the next player's state changes and turn starts.

class Catan
  # main class
  def initialize
  end
