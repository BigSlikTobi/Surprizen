class Journey < ApplicationRecord
    enum status: { designing: 0, paid: 1, launched: 2, completed: 3 }
end
