"""Faker en_IN only. Output is piped to Node; no plaintext seed file is retained."""
import json, random, sys
from faker import Faker
fake=Faker('en_IN'); Faker.seed(26263); random.seed(26263)
sys.stdout.reconfigure(encoding='utf-8')
people=[]
for i in range(5000):
    people.append(dict(id=f'STU{i+1:05}', name=fake.name(), dob=fake.date_of_birth(minimum_age=19,maximum_age=24).isoformat(),
        apaar=f'990{i+1:09}', mobile=f'000{i+1:07}', email=f'student{i+1}@example.invalid',
        passport=f'ZZ{i+1:07}', nationality='IN',category='DOMESTIC'))
print(json.dumps(people,ensure_ascii=False))
