class AddJourneyToUsers < ActiveRecord::Migration[8.0]
  def change
    add_reference :users, :journey, null: false, foreign_key: true
  end
end
