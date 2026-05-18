INSERT INTO projects (project_id, name, disease_type, primary_site) VALUES
('TCGA-BRCA','Breast Invasive Carcinoma','Ductal and Lobular Neoplasms','Breast'),
('TCGA-LUAD','Lung Adenocarcinoma','Adenomas and Adenocarcinomas','Bronchus and lung'),
('TCGA-COAD','Colon Adenocarcinoma','Adenomas and Adenocarcinomas','Colon'),
('TCGA-GBM','Glioblastoma Multiforme','Gliomas','Brain'),
('TCGA-PRAD','Prostate Adenocarcinoma','Adenomas and Adenocarcinomas','Prostate gland')
ON CONFLICT (project_id) DO NOTHING;

INSERT INTO cases (case_id, project_id, submitter_id, primary_site, disease_type, gender, age_at_diagnosis, vital_status, days_to_death, days_to_last_follow_up) VALUES
('BRCA-001','TCGA-BRCA','TCGA-A1-A0SB','Breast','Ductal and Lobular Neoplasms','female',55,'Alive',NULL,1200),
('BRCA-002','TCGA-BRCA','TCGA-A2-A04P','Breast','Ductal and Lobular Neoplasms','female',47,'Alive',NULL,920),
('BRCA-003','TCGA-BRCA','TCGA-A7-A0CE','Breast','Ductal and Lobular Neoplasms','female',63,'Dead',540,NULL),
('BRCA-004','TCGA-BRCA','TCGA-BH-A0AV','Breast','Ductal and Lobular Neoplasms','female',71,'Alive',NULL,800),
('BRCA-005','TCGA-BRCA','TCGA-C8-A12Z','Breast','Ductal and Lobular Neoplasms','female',38,'Alive',NULL,1100),
('BRCA-006','TCGA-BRCA','TCGA-D8-A1XQ','Breast','Ductal and Lobular Neoplasms','female',NULL,'Alive',NULL,400),
('LUAD-001','TCGA-LUAD','TCGA-44-2665','Bronchus and lung','Adenomas and Adenocarcinomas','male',68,'Dead',300,NULL),
('LUAD-002','TCGA-LUAD','TCGA-49-4488','Bronchus and lung','Adenomas and Adenocarcinomas','female',59,'Alive',NULL,760),
('LUAD-003','TCGA-LUAD','TCGA-50-5931','Bronchus and lung','Adenomas and Adenocarcinomas','male',73,'Dead',620,NULL),
('LUAD-004','TCGA-LUAD','TCGA-55-6981','Bronchus and lung','Adenomas and Adenocarcinomas','female',44,'Alive',NULL,980),
('LUAD-005','TCGA-LUAD','TCGA-64-1676','Bronchus and lung','Adenomas and Adenocarcinomas','male',81,'Alive',NULL,340),
('LUAD-006','TCGA-LUAD','TCGA-67-3771','Bronchus and lung','Adenomas and Adenocarcinomas','female',52,'Dead',710,NULL),
('COAD-001','TCGA-COAD','TCGA-AA-3489','Colon','Adenomas and Adenocarcinomas','male',61,'Alive',NULL,1500),
('COAD-002','TCGA-COAD','TCGA-AA-3514','Colon','Adenomas and Adenocarcinomas','female',69,'Dead',410,NULL),
('COAD-003','TCGA-COAD','TCGA-AD-6888','Colon','Adenomas and Adenocarcinomas','male',57,'Alive',NULL,870),
('COAD-004','TCGA-COAD','TCGA-AY-4070','Colon','Adenomas and Adenocarcinomas','female',76,'Alive',NULL,660),
('COAD-005','TCGA-COAD','TCGA-CA-5255','Colon','Adenomas and Adenocarcinomas','male',49,'Alive',NULL,990),
('COAD-006','TCGA-COAD','TCGA-CM-5348','Colon','Adenomas and Adenocarcinomas','female',-1,'Alive',NULL,120),
('GBM-001','TCGA-GBM','TCGA-02-0003','Brain','Gliomas','male',64,'Dead',210,NULL),
('GBM-002','TCGA-GBM','TCGA-06-0125','Brain','Gliomas','female',58,'Dead',390,NULL),
('GBM-003','TCGA-GBM','TCGA-08-0354','Brain','Gliomas','male',45,'Alive',NULL,500),
('GBM-004','TCGA-GBM','TCGA-12-0616','Brain','Gliomas','female',70,'Dead',180,NULL),
('GBM-005','TCGA-GBM','TCGA-14-0786','Brain','Gliomas','male',53,'Alive',NULL,620),
('GBM-006','TCGA-GBM','TCGA-19-1787','Brain','Gliomas',NULL,67,'Dead',250,NULL),
('PRAD-001','TCGA-PRAD','TCGA-2A-A8VL','Prostate gland','Adenomas and Adenocarcinomas','male',62,'Alive',NULL,1400),
('PRAD-002','TCGA-PRAD','TCGA-CH-5737','Prostate gland','Adenomas and Adenocarcinomas','male',70,'Alive',NULL,1000),
('PRAD-003','TCGA-PRAD','TCGA-EJ-5512','Prostate gland','Adenomas and Adenocarcinomas','male',59,'Alive',NULL,830),
('PRAD-004','TCGA-PRAD','TCGA-FC-7961','Prostate gland','Adenomas and Adenocarcinomas','male',74,'Dead',900,NULL),
('PRAD-005','TCGA-PRAD','TCGA-G9-6379','Prostate gland','Adenomas and Adenocarcinomas','male',66,'Alive',NULL,780),
('PRAD-006','TCGA-PRAD','TCGA-HC-8266','Prostate gland','Adenomas and Adenocarcinomas','male',51,'Alive',NULL,1120)
ON CONFLICT (case_id) DO NOTHING;

INSERT INTO samples (sample_id, case_id, sample_type, tissue_type, data_category, data_type)
SELECT case_id || '-01', case_id, 'Primary Tumor', 'Tumor', 'Transcriptome Profiling', 'Gene Expression Quantification' FROM cases
ON CONFLICT (sample_id) DO NOTHING;

INSERT INTO samples (sample_id, case_id, sample_type, tissue_type, data_category, data_type)
SELECT case_id || '-10', case_id, 'Blood Derived Normal', 'Normal', 'Simple Nucleotide Variation', 'Masked Somatic Mutation'
FROM cases WHERE right(case_id, 1)::int % 2 = 0
ON CONFLICT (sample_id) DO NOTHING;
