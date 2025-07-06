class AddUserToJourneys < ActiveRecord::Migration[8.0]
  def change
    add_reference :journeys, :user, null: false, foreign_key: true
  end
end
