class CreateJourneys < ActiveRecord::Migration[8.0]
  def change
    create_table :journeys do |t|
      t.string :title
      t.string :recipient_name
      t.decimal :budget
      t.string :occation
      t.string :tone
      t.integer :status
      t.datetime :scheduled_at

      t.timestamps
    end
  end
end
