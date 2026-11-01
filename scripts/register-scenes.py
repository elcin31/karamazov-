"""Register original, explicitly contemporary visual interpretations (not archival sources)."""
from pathlib import Path
from PIL import Image
import json
ROOT=Path(__file__).resolve().parents[1]
items=[
('brothers-tavern','exec-9d43fa60-8bd9-4c57-a08d-c2c5f159da73.png','Разговор братьев',['ivan','alexei'],['5-3','5-4','5-5'],'Диалог Ивана и Алёши. Интерпретация трактирного пространства и психологического расстояния между собеседниками.'),
('zosima-cell','exec-62ae40d2-1fc2-4912-b2c6-e21510155682.png','В келье старца',['alexei','zosima'],['2-4','6-3'],'Алёша слушает Зосиму. Обобщённая композиция ученичества, не документальная реконструкция конкретного монастырского интерьера.'),
('dmitri-mokroe','exec-ede2f8b2-2f02-4e56-a2e0-0bb3f4ca2ded.png','Мокрое: приход следствия',['dmitri','grushenka','mikhail-makarovich','nikolai-parfenovich'],['8-8','9-1'],'Образ перелома между праздником и следствием. Фигуры чиновников условны; изображение не является точной реконструкцией внешности исторических или вымышленных лиц.'),
('grushenka-lamp','exec-c7352b39-b850-4f6a-b010-eca150a4d683.png','Грушенька и луковка',['grushenka'],['7-3'],'Символический портрет с мотивом притчи о луковке. Луковица в руке — художественный образ, не утверждение о буквальном действии героини в тексте.'),
('smerdyakov-kitchen','exec-4c23f39e-2cba-4bcc-8dde-0e91234772a5.png','Комната Смердякова',['smerdyakov'],['3-6','5-2','11-8'],'Условный интерьер слуги с гитарой. Предметы и обстановка помогают поставить вопрос о зависимости и отдельности; это современная интерпретация.'),
('trial','exec-c0d8e5a2-47ef-4135-ae35-181ae4bd58de.png','Зал суда',['dmitri','fetyukovich','ippolit'],['12-1','12-14'],'Собирательная композиция провинциального российского суда после реформы 1864 года. Не фотография реального заседания и не точный план судебного зала романа.'),
('inquisitor','exec-7308f1a9-b101-48f1-9bb8-c627e39112d4.png','Узник и инквизитор',['ivan','alexei'],['5-5'],'Интерпретация поэмы Ивана: узник и инквизитор в условном пространстве Севильи XVI века. Внутренний сюжет поэмы, не историческое свидетельство.'),
('stone-epilogue','exec-f0b6b799-e089-4437-bb96-7b2713da833f.png','У камня',['alexei','kolya','smurov'],['13-3'],'Алёша и мальчики. Пространство и сезон трактуются художником условно; композиция передаёт мотив общей памяти, а не топографическую или календарную точность.'),
('dmitri-garden','exec-c11e7731-e8b3-431f-99c4-a546ff4068bd.png','У садовой ограды',['dmitri','grigory'],['8-4'],'Современное прочтение ночного садового эпизода. Показано напряжение встречи, а не буквальный момент удара или документальная фиксация маршрута.'),
('boys-snegiryov','exec-7a31e48d-954e-466f-991f-47e42296e488.png','Отец и сын Снегирёвы',['snegiryov','ilyusha'],['4-6','4-7'],'Собирательная композиция семьи Снегирёвых. Не отдельный дословно описанный эпизод; образ отцовского достоинства и детской привязанности.')]
records=[]
for ident,filename,title,people,chapters,description in items:
 source=Path('/workspace/generated_images')/filename
 if not source.is_file():raise SystemExit(f'Missing generated output {filename}')
 image=Image.open(source).convert('RGB');image.save(ROOT/'public/images/scenes'/f'{ident}.webp',quality=87,method=6)
 records.append(dict(id=ident,src=f'/images/scenes/{ident}.webp',title=title,author='Литературный музей «Карамазов» · генерация OpenAI',date='2026',sourceUrl='',license='Оригинальная генерация для проекта; без заявления об исключительных правах',licenseUrl='https://openai.com/policies/terms-of-use/',description=description+' Оригинальная цифровая графика: офортный рисунок и сдержанные цветовые заливки. Не историческое произведение.',section='Сюжетные реконструкции',kind='generated',era='generated',width=image.width,height=image.height,characterIds=people,chapterIds=chapters,tags=['современная реконструкция','сюжет','книжная графика']))
p=ROOT/'src/data/images.json';catalog=json.loads(p.read_text());known={r['id'] for r in records};catalog=[a for a in catalog if a['id'] not in known]+records;p.write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+'\n');(ROOT/'docs/generated-scenes-v2.json').write_text(json.dumps(records,ensure_ascii=False,indent=2)+'\n');print(f'{len(records)} original illustrations registered; catalog {len(catalog)}')
